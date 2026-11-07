@Library('bswdi-jenkins')

def branch = env.BRANCH_NAME.replaceAll("/", "_")
def image
def publicApiBaseUrl
def publicBaseUrl
String phpImageName = "nouse/website/php:${branch}-${env.BUILD_ID}"
String astroImageName = "nouse/website/astro:${branch}-${env.BUILD_ID}"
String reactImageName = "nouse/website/react:${branch}-${env.BUILD_ID}"
def productionBuild = env.TAG_NAME ==~ /v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/

pipeline {
  agent {
    label 'docker'
  }

  environment {
    DOCKER_BUILDKIT = '1'
  }

  stages {
    stage('Fetch Secrets') {
      stages {
        stage('Preview') {
          when {
            anyOf {
              changeRequest target: 'main'
              changeRequest target: 'feature/*', comparator: 'GLOB'
            }
          }
          steps {
            withCredentials([string(credentialsId: 'vault-ansible', variable: 'VAULT_TOKEN')]) {
              script {
                def response = httpRequest(
                  customHeaders: [
                    [maskValue: true, name: 'X-Vault-Token', value: env.VAULT_TOKEN]
                  ],
                  httpMode: 'GET',
                  url: "${env.VAULT_ADDR}/v1/kv/data/nouse-website-dev",
                  validResponseCodes: '200'
                )

                def json = readJSON text: response.content
                env.DATABASE_URL = json.data.data['database-url']
                // Astro inlines these at build time, so each preview points at its own React
                publicApiBaseUrl = "https://pr-${env.CHANGE_ID}-api-nouse.${env.PREVIEW_URL_SUFFIX}"
                publicBaseUrl = "https://pr-${env.CHANGE_ID}-nouse.${env.PREVIEW_URL_SUFFIX}"
              }
            }
          }
        }

        stage('Development') {
          when {
            expression { env.BRANCH_IS_PRIMARY }
          }
          steps {
            withCredentials([string(credentialsId: 'vault-ansible', variable: 'VAULT_TOKEN')]) {
              script {
                def response = httpRequest(
                  customHeaders: [
                    [maskValue: true, name: 'X-Vault-Token', value: env.VAULT_TOKEN]
                  ],
                  httpMode: 'GET',
                  url: "${env.VAULT_ADDR}/v1/kv/data/nouse-website-dev",
                  validResponseCodes: '200'
                )

                def json = readJSON text: response.content
                env.DATABASE_URL = json.data.data['database-url']
                publicApiBaseUrl = json.data.data['public-api-base-url']
                publicBaseUrl = json.data.data['public-base-url']
              }
            }
          }
        }

        stage('Production') {
          when {
            // Checking if it is semantic version release.
            expression { return productionBuild }
          }
          steps {
            withCredentials([string(credentialsId: 'vault-ansible', variable: 'VAULT_TOKEN')]) {
              script {
                def response = httpRequest(
                  customHeaders: [
                    [maskValue: true, name: 'X-Vault-Token', value: env.VAULT_TOKEN]
                  ],
                  httpMode: 'GET',
                  url: "${env.VAULT_ADDR}/v1/kv/data/nouse-website-prod",
                  validResponseCodes: '200'
                )

                def json = readJSON text: response.content
                env.DATABASE_URL = json.data.data['database-url']
                publicApiBaseUrl = json.data.data['public-api-base-url']
                publicBaseUrl = json.data.data['public-base-url']
              }
            }
          }
        }
      }
    }

    stage('Build images') {
      parallel {
        stage('Build PHP backend') {
          steps {
            script {
              def GIT_COMMIT_HASH = sh (script: "git log -n 1 --pretty=format:'%H' | head -c 7", returnStdout: true)
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT) {
                phpImage = docker.build(phpImageName, "--build-arg STREAMER_VERSION_ARG=${env.BRANCH_NAME}-${env.BUILD_ID} --build-arg STREAMER_COMMIT_ARG=${GIT_COMMIT_HASH} --no-cache -f Dockerfile.php-df .")
              }
            }
          }
        }
        stage('Build Astro frontend') {
          steps {
            script {
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT) {
                astroImage = docker.build(astroImageName, "--build-arg STREAMER_VERSION_ARG=${env.BRANCH_NAME}-${env.BUILD_ID} \
                  --build-arg PUBLIC_API_BASE_URL=${publicApiBaseUrl} \
                  --build-arg PUBLIC_BASE_URL=${publicBaseUrl} \
                  --no-cache -f Dockerfile.astro-df ."
                )
              }
            }
          }
        }
        stage('Build React backend') {
          steps {
            script {
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT) {
                reactImage = docker.build(reactImageName, "--build-arg STREAMER_VERSION_ARG=${env.BRANCH_NAME}-${env.BUILD_ID} \
                  --build-arg DATABASE_URL \
                  --no-cache -f Dockerfile.react-df ."
                )
              }
            }
          }
        }
      }
    }

    stage('Push images to registry') {
      parallel {
        stage('Push PHP image to registry') {
          steps {
            script {
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT) {
                phpImage.push()
                if (env.BRANCH_IS_PRIMARY) {
                  phpImage.push('latest')
                }
                if (env.CHANGE_ID) {
                  phpImage.push("pr-${env.CHANGE_ID}")
                }
              }
            }
          }
        }
        stage('Push Astro image to registry') {
          steps {
            script {
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT) {
                astroImage.push()
                if (env.BRANCH_IS_PRIMARY) {
                  astroImage.push('latest')
                }
                if (env.CHANGE_ID) {
                  astroImage.push("pr-${env.CHANGE_ID}")
                }
              }
            }
          }
        }
        stage('Push React image to registry') {
          steps {
            script {
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT) {
                reactImage.push()
                if (env.BRANCH_IS_PRIMARY) {
                  reactImage.push('latest')
                }
                if (env.CHANGE_ID) {
                  reactImage.push("pr-${env.CHANGE_ID}")
                }
              }
            }
          }
        }
      }
    }

    stage('Deploy') {
      stages {
        stage('Preview') {
          when {
            anyOf {
              changeRequest target: 'main'
              changeRequest target: 'feature/*', comparator: 'GLOB'
            }
          }
          stages {
            stage('Cleanup previews') {
              agent {
                label 'nomad'
              }
              steps {
                deployPreview action: 'cleanup'
                deployPreview action: 'cleanupMerge'
              }
            }
            stage('Preview') {
              steps {
                deployPreview action: 'deploy', job: 'nouse-website/preview', jobName: 'nouse-website-preview', urlSuffix: "nouse.${env.PREVIEW_URL_SUFFIX}"
              }
            }
          }
        }

        stage('Development') {
          when {
            expression { env.BRANCH_IS_PRIMARY }
          }
          stages {
            stage('Deploy to development') {
              steps {
                build job: 'Deploy Nomad Job', parameters: [
                  string(name: 'JOB_FILE', value: 'nouse-website/dev'),
                  text(name: 'TAG_REPLACEMENTS', value: "${env.REGISTRY_ENDPOINT}/${phpImageName} ${env.REGISTRY_ENDPOINT}/${astroImageName} ${env.REGISTRY_ENDPOINT}/${reactImageName}")
                ], wait: true
              }
            }

            stage('Post-deploy cleanup') {
              agent {
                label 'nomad'
              }
              steps {
                checkout scm
                deployPreview action: 'cleanup'
                deployPreview action: 'cleanupMerge'
              }
            }
          }
        }

        stage('Production') {
          when {
            // Checking if it is semantic version release.
            expression { return productionBuild }
          }
          steps {
            build(job: 'Deploy Nomad Job', parameters: [
              string(name: 'JOB_FILE', value: 'nouse-website/prod'),
              text(name: 'TAG_REPLACEMENTS', value: "${env.REGISTRY_ENDPOINT}/${phpImageName} ${env.REGISTRY_ENDPOINT}/${astroImageName} ${env.REGISTRY_ENDPOINT}/${reactImageName}")
            ])
          }
        }
      }
    }
  }
}
