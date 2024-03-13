import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import * as http from '@actions/http-client'

import { wait } from './wait'
import { dl_source } from './dl_source'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get tags from Perl repo
    //~ https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-tags
    const url = 'https://api.github.com/repos/perl/perl5/tags'
    const client = new http.HttpClient()

    const res: http.HttpClientResponse = await client.get(url)

    //if (res.message.statusCode === 200)
    {
      const json = await res.readBody()
      console.debug(`json: ${json}`)
      /*
      const tags = JSON.parse(json) as { name: string }[]

      const latestTag = tags.reduce((prev, current) => {
        const prevVersion = prev.name.split('.').map(Number)
        const currentVersion = current.name.split('.').map(Number)
        return prevVersion.every((v, idx) => v >= currentVersion[idx])
          ? prev
          : current
      }, tags[0])

      core.setOutput('latest_version', latestTag.name)

      // Extract and sort version numbers
      const versions = tags.map(tag => tag.name.replace(/^v/, ''))
      versions.sort((a, b) => b.localeCompare(a))

      // Get the most recent version
      const latestVersion = versions[0]

      // Set output
      //core.setOutput('latest_version', latestVersion);

      console.log(`Latest Perl version: ${latestVersion}`)*/
    }
    const ms: string = core.getInput('milliseconds')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())

    const version = core.getInput('version')
    const cwd = core.getInput('cwd')

    {
      const allNodeVersions = tc.findAllVersions('perl')
      console.log(`Versions of perl available: ${allNodeVersions}`)
    }
    const extract = await dl_source(version, `${cwd}/source/${version}`)

    core.debug(`${extract}/perl5-${version}`)

    const options = {
      cwd: `${extract}/perl5-${version}`,
      silent: false
    }
    //~ await exec.exec('ls', ['-R'], options)
    await exec.exec(
      './Configure',
      ['-des', `-Dprefix=${cwd}/perl-${version}`],
      options
    )

    await exec.exec('make', [], options)
    await exec.exec('make', ['install'], options)

    //~ const node12ExtractedFolder = await tc.extractTar(node12Path, 'path/to/extract/to');

    const cachedPath = await tc.cacheDir(
      `${cwd}/perl-${version}/`,
      'perl',
      version
    )
    core.addPath(cachedPath)

    //~ if (IS_WINDOWS) {
    //~ pythonExtractedFolder = await tc.extractZip(pythonPath);
    //~ } else {
    //~ pythonExtractedFolder = await tc.extractTar(pythonPath);
    //~ }

    //core.info('Execute installation script');
    //await installPerl(perl5ExtractedFolder);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
