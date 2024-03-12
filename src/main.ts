import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'

import { wait } from './wait'
import { dl_source } from './dl_source'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
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
      `${cwd}/perl-${version}`,
      'perl',
      version
    )
    core.addPath(cachedPath)

    {
      const allNodeVersions = tc.findAllVersions('perl')
      console.log(`Versions of perl available: ${allNodeVersions}`)
    }

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
