import * as core from '@actions/core'
import { wait } from './wait'
import { dl_source } from './dl_source'

import * as exec from '@actions/exec'

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
    const extract = await dl_source(version, core.getInput('cwd'))

    core.debug(`${extract}/perl-${version}`)

    const options = {
      cwd: `${extract}/perl-${version}`,
      silent: false
    }

    await exec.exec(
      './Configure',
      ['-des', `.Dprefix=$HOME/perl${version}`],
      options
    )

    await exec.exec('make', [], options)
    await exec.exec('make', ['install'], options)

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
