# ZeroStock V5 – GitHub Release Signing

ZeroStock wird ausschliesslich in GitHub Actions gebaut. Der private Android-Signing-Key darf niemals in dieses Repository committed werden.

## Benötigte GitHub Actions Secrets

Im Repository:

Settings → Secrets and variables → Actions → New repository secret

Folgende vier Secrets anlegen:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

Die Werte liegen im lokal erzeugten ZeroStock-Signing-Paket ausserhalb von GitHub.

## Release-Ablauf

Nach dem Hinterlegen der vier Secrets:

1. Tag `v5.0.0-rc.1` auf dem freigegebenen Commit erstellen.
2. GitHub Actions startet automatisch.
3. Die Pipeline baut zuerst die Web-Assets und führt alle ZeroStock-Gates aus.
4. Capacitor erzeugt/synchronisiert das Android-Projekt.
5. Gradle erzeugt die Release-APK.
6. GitHub decodiert den Keystore nur temporär auf dem Runner.
7. `apksigner` signiert und verifiziert die APK.
8. SHA-256 wird erzeugt.
9. APK und Prüfsumme werden als GitHub Release Assets veröffentlicht.
10. RC-Tags werden automatisch als Prerelease markiert.

## Sicherheitsregeln

- Keystore niemals committen.
- Base64-Keystore niemals in Issues, Discussions, README oder Actions-Logs kopieren.
- Passwörter niemals als Klartext in Workflow-Dateien schreiben.
- Den ursprünglichen Keystore dauerhaft sichern. Ohne denselben privaten Key sind spätere APK-Updates derselben App-ID nicht installierbar.
- Falls ein Secret kompromittiert wird, Release stoppen und Signing-Strategie neu bewerten.

## App-ID

`ch.zerogen.zerostock`

## Release-Branch

`v5-cloud-build`
