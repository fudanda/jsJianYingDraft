import { spawnSync } from "node:child_process";

import { AutomationError, DraftNotFoundError } from "./errors.js";

export enum ExportResolution {
  RES_8K = "8K",
  RES_4K = "4K",
  RES_2K = "2K",
  RES_1080P = "1080P",
  RES_720P = "720P",
  RES_480P = "480P"
}

export enum ExportFramerate {
  FR_24 = "24fps",
  FR_25 = "25fps",
  FR_30 = "30fps",
  FR_50 = "50fps",
  FR_60 = "60fps"
}

export interface ExportDraftOptions {
  outputPath?: string;
  resolution?: ExportResolution;
  framerate?: ExportFramerate;
  timeout?: number;
}

export interface PowerShellRunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export type PowerShellRunner = (script: string) => PowerShellRunResult;

export interface JianyingControllerOptions {
  runner?: PowerShellRunner;
  skipPlatformCheck?: boolean;
}

function quotePowerShell(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function defaultPowerShellRunner(script: string): PowerShellRunResult {
  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { encoding: "utf8", windowsHide: true }
  );

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

function buildControllerScript(
  action: "getWindow" | "switchToHome" | "exportDraft",
  draftName: string | null,
  outputPath: string | null,
  resolution: string | null,
  framerate: string | null,
  timeoutSeconds: number
): string {
  const draftNameExpr = draftName === null ? "$null" : quotePowerShell(draftName);
  const outputPathExpr = outputPath === null ? "''" : quotePowerShell(outputPath);
  const resolutionExpr = resolution === null ? "''" : quotePowerShell(resolution);
  const framerateExpr = framerate === null ? "''" : quotePowerShell(framerate);

  return `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms

$Action = ${quotePowerShell(action)}
$DraftName = ${draftNameExpr}
$OutputPath = ${outputPathExpr}
$Resolution = ${resolutionExpr}
$Framerate = ${framerateExpr}
$TimeoutSeconds = ${Math.round(timeoutSeconds)}

$FullDescriptionProperty = [System.Windows.Automation.AutomationProperty]::LookupById(30159)
$TrueCondition = [System.Windows.Automation.Condition]::TrueCondition
$RawWalker = [System.Windows.Automation.TreeWalker]::RawViewWalker

function Test-TextMatch {
    param(
        [string]$Value,
        [string]$Target,
        [bool]$Exact
    )
    if ([string]::IsNullOrEmpty($Value)) {
        return $false
    }
    if ($Exact) {
        return $Value -eq $Target
    }
    return $Value -like "*$Target*"
}

function Get-ElementDescriptor {
    param([System.Windows.Automation.AutomationElement]$Element)

    $name = ''
    $automationId = ''
    $fullDescription = ''

    try { $name = [string]$Element.Current.Name } catch {}
    try { $automationId = [string]$Element.Current.AutomationId } catch {}
    try {
        if ($null -ne $FullDescriptionProperty) {
            $raw = $Element.GetCurrentPropertyValue($FullDescriptionProperty)
            if ($null -ne $raw) {
                $fullDescription = [string]$raw
            }
        }
    } catch {}

    return @{
        Name = $name
        AutomationId = $automationId
        FullDescription = $fullDescription
    }
}

function Get-JianyingWindow {
    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $children = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $TrueCondition)

    for ($i = 0; $i -lt $children.Count; $i += 1) {
        $window = $children.Item($i)
        if ($window.Current.ControlType.ProgrammaticName -ne 'ControlType.Window') {
            continue
        }

        $desc = Get-ElementDescriptor -Element $window
        $procName = ''
        try {
            $proc = Get-Process -Id $window.Current.ProcessId -ErrorAction SilentlyContinue
            if ($null -ne $proc) {
                $procName = $proc.ProcessName
            }
        } catch {}

        if (
            ($desc.Name -like '*剪映*') -or
            ($desc.Name -like '*CapCut*') -or
            ($procName -match 'Jianying|JianYing|CapCut')
        ) {
            return $window
        }
    }

    throw 'AutomationError: 剪映窗口未找到'
}

function Find-ElementByText {
    param(
        [System.Windows.Automation.AutomationElement]$Root,
        [string]$Target,
        [int]$Depth = 2,
        [bool]$Exact = $false,
        [double]$TimeoutSeconds = 10
    )

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        $queue = New-Object System.Collections.ArrayList
        [void]$queue.Add(@($Root, 0))

        while ($queue.Count -gt 0) {
            $pair = $queue[0]
            $queue.RemoveAt(0)
            $node = $pair[0]
            $level = [int]$pair[1]

            if ($level -eq $Depth) {
                $desc = Get-ElementDescriptor -Element $node
                if (
                    (Test-TextMatch -Value $desc.FullDescription -Target $Target -Exact $Exact) -or
                    (Test-TextMatch -Value $desc.AutomationId -Target $Target -Exact $Exact) -or
                    (Test-TextMatch -Value $desc.Name -Target $Target -Exact $Exact)
                ) {
                    return $node
                }
            }

            if ($level -lt $Depth) {
                $children = $node.FindAll([System.Windows.Automation.TreeScope]::Children, $TrueCondition)
                for ($i = 0; $i -lt $children.Count; $i += 1) {
                    [void]$queue.Add(@($children.Item($i), $level + 1))
                }
            }
        }

        Start-Sleep -Milliseconds 250
    }

    return $null
}

function Find-ElementByClassContains {
    param(
        [System.Windows.Automation.AutomationElement]$Root,
        [string]$ClassContains,
        [int]$Depth = 1,
        [int]$FoundIndex = 0,
        [double]$TimeoutSeconds = 3
    )

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        $queue = New-Object System.Collections.ArrayList
        [void]$queue.Add(@($Root, 0))
        $currentIndex = 0

        while ($queue.Count -gt 0) {
            $pair = $queue[0]
            $queue.RemoveAt(0)
            $node = $pair[0]
            $level = [int]$pair[1]

            if ($level -eq $Depth) {
                $className = ''
                try { $className = [string]$node.Current.ClassName } catch {}
                if ($className -like "*$ClassContains*") {
                    if ($currentIndex -eq $FoundIndex) {
                        return $node
                    }
                    $currentIndex += 1
                }
            }

            if ($level -lt $Depth) {
                $children = $node.FindAll([System.Windows.Automation.TreeScope]::Children, $TrueCondition)
                for ($i = 0; $i -lt $children.Count; $i += 1) {
                    [void]$queue.Add(@($children.Item($i), $level + 1))
                }
            }
        }

        Start-Sleep -Milliseconds 200
    }

    return $null
}

function Get-ParentElement {
    param([System.Windows.Automation.AutomationElement]$Element)
    return $RawWalker.GetParent($Element)
}

function Get-NextSibling {
    param([System.Windows.Automation.AutomationElement]$Element)
    return $RawWalker.GetNextSibling($Element)
}

function Invoke-Element {
    param([System.Windows.Automation.AutomationElement]$Element)
    if ($null -eq $Element) {
        return $false
    }

    try {
        $invokePattern = $Element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        if ($null -ne $invokePattern) {
            $invokePattern.Invoke()
            return $true
        }
    } catch {}

    try {
        $selectionPattern = $Element.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
        if ($null -ne $selectionPattern) {
            $selectionPattern.Select()
            return $true
        }
    } catch {}

    try {
        $expandPattern = $Element.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern)
        if ($null -ne $expandPattern) {
            $expandPattern.Expand()
            return $true
        }
    } catch {}

    try {
        $Element.SetFocus()
        [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
        return $true
    } catch {}

    return $false
}

function Read-ExportPath {
    param([System.Windows.Automation.AutomationElement]$Window)

    $label = Find-ElementByText -Root $Window -Target 'ExportPath' -Depth 2 -Exact $true -TimeoutSeconds 1
    if ($null -eq $label) {
        return $null
    }

    $sibling = Get-NextSibling -Element $label
    if ($null -eq $sibling) {
        return $null
    }

    try {
        $valuePattern = $sibling.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        if ($null -ne $valuePattern) {
            return [string]$valuePattern.Current.Value
        }
    } catch {}

    $desc = Get-ElementDescriptor -Element $sibling
    if (-not [string]::IsNullOrEmpty($desc.Name)) {
        return $desc.Name
    }
    if (-not [string]::IsNullOrEmpty($desc.FullDescription)) {
        return $desc.FullDescription
    }
    return $null
}

function Set-ExportOption {
    param(
        [System.Windows.Automation.AutomationElement]$Window,
        [string]$DropdownMarker,
        [string]$OptionText
    )

    $dropdown = Find-ElementByText -Root $Window -Target $DropdownMarker -Depth 2 -Exact $true -TimeoutSeconds 2
    if ($null -eq $dropdown) {
        throw "AutomationError: 未找到导出设置项 $DropdownMarker"
    }
    if (-not (Invoke-Element -Element $dropdown)) {
        throw "AutomationError: 无法打开导出设置项 $DropdownMarker"
    }

    Start-Sleep -Milliseconds 500
    $option = Find-ElementByText -Root $Window -Target $OptionText -Depth 3 -Exact $false -TimeoutSeconds 2
    if ($null -eq $option) {
        throw "AutomationError: 未找到导出选项 $OptionText"
    }
    if (-not (Invoke-Element -Element $option)) {
        throw "AutomationError: 无法选择导出选项 $OptionText"
    }
}

function Switch-ToHome {
    param([System.Windows.Automation.AutomationElement]$Window)
    $closeBtn = Find-ElementByClassContains -Root $Window -ClassContains 'TitleBarButton' -Depth 1 -FoundIndex 3 -TimeoutSeconds 1
    if ($null -ne $closeBtn) {
        [void](Invoke-Element -Element $closeBtn)
        Start-Sleep -Seconds 2
    }
}

function Invoke-ExportDraft {
    $window = Get-JianyingWindow
    $draftTarget = "HomePageDraftTitle:$DraftName"
    $draftTitle = Find-ElementByText -Root $window -Target $draftTarget -Depth 2 -Exact $true -TimeoutSeconds 10
    if ($null -eq $draftTitle) {
        throw "DraftNotFound: 未找到名为 $DraftName 的剪映草稿"
    }

    $draftButton = Get-ParentElement -Element $draftTitle
    if ($null -eq $draftButton) {
        $draftButton = $draftTitle
    }
    if (-not (Invoke-Element -Element $draftButton)) {
        throw "AutomationError: 无法打开草稿 $DraftName"
    }

    Start-Sleep -Seconds 3
    $window = Get-JianyingWindow

    $exportBtn = Find-ElementByText -Root $window -Target 'MainWindowTitleBarExportBtn' -Depth 2 -Exact $true -TimeoutSeconds 8
    if ($null -eq $exportBtn) {
        throw 'AutomationError: 未在编辑窗口中找到导出按钮'
    }
    if (-not (Invoke-Element -Element $exportBtn)) {
        throw 'AutomationError: 导出按钮点击失败'
    }

    Start-Sleep -Seconds 2
    $window = Get-JianyingWindow

    $sourceExportPath = Read-ExportPath -Window $window

    if (-not [string]::IsNullOrWhiteSpace($Resolution)) {
        Set-ExportOption -Window $window -DropdownMarker 'ExportSharpnessInput' -OptionText $Resolution
    }
    if (-not [string]::IsNullOrWhiteSpace($Framerate)) {
        Set-ExportOption -Window $window -DropdownMarker 'FrameRateInput' -OptionText $Framerate
    }

    $confirmBtn = Find-ElementByText -Root $window -Target 'ExportOkBtn' -Depth 2 -Exact $true -TimeoutSeconds 8
    if ($null -eq $confirmBtn) {
        throw 'AutomationError: 未在导出窗口中找到确认导出按钮'
    }
    if (-not (Invoke-Element -Element $confirmBtn)) {
        throw 'AutomationError: 导出确认按钮点击失败'
    }

    Start-Sleep -Seconds 2
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        $window = Get-JianyingWindow
        $succeedClose = Find-ElementByText -Root $window -Target 'ExportSucceedCloseBtn' -Depth 2 -Exact $true -TimeoutSeconds 0.5
        if ($null -ne $succeedClose) {
            [void](Invoke-Element -Element $succeedClose)

            if (
                (-not [string]::IsNullOrWhiteSpace($OutputPath)) -and
                (-not [string]::IsNullOrWhiteSpace($sourceExportPath)) -and
                (Test-Path -LiteralPath $sourceExportPath)
            ) {
                Move-Item -LiteralPath $sourceExportPath -Destination $OutputPath -Force
            }

            Write-Output 'OK'
            return
        }
        Start-Sleep -Seconds 1
    }

    throw "AutomationError: 导出超时，时限为 $TimeoutSeconds 秒"
}

try {
    if ($Action -eq 'getWindow') {
        [void](Get-JianyingWindow)
        Write-Output 'OK'
    } elseif ($Action -eq 'switchToHome') {
        $window = Get-JianyingWindow
        Switch-ToHome -Window $window
        Write-Output 'OK'
    } elseif ($Action -eq 'exportDraft') {
        if ([string]::IsNullOrWhiteSpace($DraftName)) {
            throw 'AutomationError: draftName 不能为空'
        }
        Invoke-ExportDraft
    } else {
        throw "AutomationError: 不支持的动作 $Action"
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
`;
}

export class JianyingController {
  private readonly runner: PowerShellRunner;

  constructor(options: JianyingControllerOptions = {}) {
    if (!options.skipPlatformCheck && process.platform !== "win32") {
      throw new AutomationError("JianyingController is only supported on Windows");
    }
    this.runner = options.runner ?? defaultPowerShellRunner;
  }

  private runAction(
    action: "getWindow" | "switchToHome" | "exportDraft",
    payload: {
      draftName?: string;
      outputPath?: string;
      resolution?: string;
      framerate?: string;
      timeout?: number;
    } = {}
  ): void {
    const timeoutSeconds = payload.timeout ?? 1_200;
    const script = buildControllerScript(
      action,
      payload.draftName ?? null,
      payload.outputPath ?? null,
      payload.resolution ?? null,
      payload.framerate ?? null,
      timeoutSeconds
    );

    const result = this.runner(script);
    const stdout = result.stdout.trim();
    const stderr = result.stderr.trim();
    if (result.status === 0) {
      return;
    }

    const combined = `${stdout}\n${stderr}`;
    const draftNotFoundMatch = combined.match(/DraftNotFound:\s*([^\r\n]+)/);
    if (draftNotFoundMatch?.[1]) {
      throw new DraftNotFoundError(draftNotFoundMatch[1]);
    }

    const msg = combined.trim() || "Unknown automation error";
    throw new AutomationError(msg);
  }

  getWindow(): void {
    this.runAction("getWindow");
  }

  switchToHome(): void {
    this.runAction("switchToHome");
  }

  exportDraft(draftName: string, options: ExportDraftOptions = {}): void {
    this.runAction("exportDraft", {
      draftName,
      outputPath: options.outputPath,
      resolution: options.resolution,
      framerate: options.framerate,
      timeout: options.timeout
    });
  }

  /** @deprecated Use getWindow instead. */
  get_window(): void {
    this.getWindow();
  }

  /** @deprecated Use switchToHome instead. */
  switch_to_home(): void {
    this.switchToHome();
  }

  /** @deprecated Use exportDraft instead. */
  export_draft(draftName: string, options: ExportDraftOptions = {}): void {
    this.exportDraft(draftName, options);
  }
}
