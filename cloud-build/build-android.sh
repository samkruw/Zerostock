#!/usr/bin/env bash
set -euo pipefail

log="$RUNNER_TEMP/native-build.log"
for attempt in 1 2 3; do
  if ./gradlew --no-daemon assembleRelease > "$log" 2>&1; then
    echo '::notice::Native release compilation passed.'
    exit 0
  fi
  if (( attempt == 3 )) || ! grep -Eq 'Could not (GET|HEAD|download)|Could not resolve [[:alnum:]_.-]+:[[:alnum:]_.-]+:|Could not get resource .https?://' "$log"; then
    break
  fi
  echo "::warning::Gradle dependency retrieval failed on attempt $attempt. Retrying."
  sleep "$(( 15 * attempt ))"
done

python3 "$GITHUB_WORKSPACE/cloud-build/report-gradle-failure.py" "$log"
exit 1
