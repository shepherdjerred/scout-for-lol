; Custom NSIS installer script for LCU Spectator

; Create uninstaller
WriteUninstaller "$INSTDIR\Uninstall.exe"

; Add registry entries for uninstaller
WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LCU Spectator" \
                 "DisplayName" "LCU Spectator"
WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LCU Spectator" \
                 "UninstallString" "$INSTDIR\Uninstall.exe"
WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LCU Spectator" \
                 "Publisher" "Scout for LoL"
WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LCU Spectator" \
                 "DisplayVersion" "${VERSION}"

; Uninstaller section
Section "Uninstall"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\LCU Spectator"
SectionEnd
