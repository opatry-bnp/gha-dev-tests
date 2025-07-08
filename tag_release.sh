#!/usr/bin/env bash

set -euo pipefail

head_sha1=$(git rev-parse HEAD)
branch_name=$(git rev-parse --abbrev-ref HEAD)
fallback_message="from ${branch_name}"

tag_mescomptes=${1:-false}
tag_hellobank=${2:-false}
delete_remote_branch=${3:-false}
sha1=${4:-""}
if [ -z "${sha1}" ]; then
  sha1="${head_sha1}"
fi
message=${5:-""}
if [ -z "${message}" ]; then
  message="${fallback_message}"
fi

if [ "${tag_mescomptes}" != true ] && [ "${tag_hellobank}" != true ]; then
  echo "Neither 'Mes Comptes' nor 'Hello Bank!' are requested for tagging, nothing to do which is not expected, please choose at least one."
  exit 1
fi

if ! git cat-file -e "${sha1}"^{commit}; then
  echo "Invalid sha1 provided '${sha1}'."
  exit 1
fi

created_tags=()

create_and_push_tag() {
  local flavor="$1"
  local sha1="$2"
  local message="$3"

  case "${flavor}" in
    'hellobank')
      tag_prefix=hb-
      flavor_name="Hello Bank!"
      ;;
    'mescomptes')
      tag_prefix=mc-
      flavor_name="Mes Comptes"
      ;;
    *) echo "Invalid flavor: $flavor" ;;
  esac

  major_version=$(grep "${flavor}MajorVersion =" app_version.gradle | awk '/Version =/ {print $3}' || true)
  [ -n "${major_version:-""}" ] || {
      echo "No major version found for ${flavor}"
      cat app_version.gradle
      exit 1
  }

  minor_version=$(grep "${flavor}MinorVersion =" app_version.gradle | awk '/Version =/ {print $3}' || true)
  [ -n "${minor_version:-""}" ] || {
      echo "No minor version found for ${flavor}"
      cat app_version.gradle
      exit 1
  }

  patch_version=$(grep "${flavor}PatchVersion =" app_version.gradle | awk '/Version =/ {print $3}' || true)
  [ -n "${patch_version:-""}" ] || {
      echo "No patch version found for ${flavor}"
      cat app_version.gradle
      exit 1
  }

  local version_name="$major_version.$minor_version.$patch_version"

  local tag_name="${tag_prefix}${version_name}"
  local tag_message="🚀 Published ${flavor_name} version ${version_name} on Play Store (${message})"

  git tag -a "${tag_name}" -m "${tag_message}" "${sha1}"
  created_tags+=("${tag_name}")
}

if [ "${tag_mescomptes}" = true ]; then
  create_and_push_tag "mescomptes" "${sha1}" "${message}"
fi

if [ "${tag_hellobank}" = true ]; then
  create_and_push_tag "hellobank" "${sha1}" "${message}"
fi

# everything was fine, we can safely push changes remotely
for tag_name in ${created_tags[*]}; do
  git push origin "${tag_name}"
done

if [ "$delete_remote_branch" = true ]; then
  git push --delete origin "${branch_name}"
fi
