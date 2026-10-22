@Library('bswdi-jenkins')

def branch = env.BRANCH_NAME.replaceAll("/", "_")
def image
def publicApiBaseUrl
def publicBaseUrl
String proceed = "yes"
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
            changeRequest target: 'main'
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
              GIT_COMMIT_HASH = sh (script: "git log -n 1 --pretty=format:'%H' | head -c 7", returnStdout: true)
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT, 'docker-registry') {
                phpImage = docker.build(phpImageName, "--build-arg STREAMER_VERSION_ARG=${env.BRANCH_NAME}-${env.BUILD_ID} --build-arg STREAMER_COMMIT_ARG=${GIT_COMMIT_HASH} --no-cache -f Dockerfile.php-df .")
              }
            }
          }
        }
        stage('Build Astro frontend') {
          steps {
            script {
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT, 'docker-registry') {
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
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT, 'docker-registry') {
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
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT, 'docker-registry') {
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
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT, 'docker-registry') {
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
              docker.withRegistry('https://' + env.REGISTRY_ENDPOINT, 'docker-registry') {
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

    stage('Checking existing streams') {
      steps {
        script {
          String url = "https://streamer."
          if (!productionBuild) {
            url += "dev."
          }
          url += "ystv.co.uk/activeStreams"
          final def (String response, String tempCode) =
              sh(script: "curl -s -w '~~~%{response_code}' $url", returnStdout: true)
                  .trim()
                  .tokenize("~~~")
          int code = Integer.parseInt(tempCode)

          echo "HTTP response status code: $code"
          echo "HTTP response: $response"

          if (code == 200) {
            if (response.contains("streams")) {
              tempStreams = sh(script: "echo '$response' | jq -M '.streams'", returnStdout: true).trim()
              int streams = Integer.parseInt(tempStreams)
              if (streams > 0) {
                echo "Pre-existing active streams: $streams, not proceeding to deploy stage"
                proceed = "no"
              } else {
                echo "No pre-existing active streams, proceeding to deploy stage"
              }
            } else {
              echo "Streamer not currently running, proceeding to deploy stage"
            }
          } else {
            echo "Invalid HTTP response code: $code, proceeding to deploy stage"
          }
        }
      }
    }

    stage('Deploy') {
      when {
        expression { proceed == "yes" }
      }
      stages {
        stage('Preview') {
          when {
            changeRequest target: 'main'
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
                deployPreview action: 'deploy', job: 'nouse-website/preview', jobName: 'nouse-website-preview', urlSuffix: 'nouse.ywrtaw51cmxz.bswdi.co.uk'
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
                  string(name: 'JOB_FILE', value: 'streamer-dev.nomad'),
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
              string(name: 'JOB_FILE', value: 'streamer-prod.nomad'),
              text(name: 'TAG_REPLACEMENTS', value: "${env.REGISTRY_ENDPOINT}/${phpImageName} ${env.REGISTRY_ENDPOINT}/${astroImageName} ${env.REGISTRY_ENDPOINT}/${reactImageName}")
            ])
          }
        }
      }
    }
  }
}
