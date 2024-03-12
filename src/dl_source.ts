import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'

/**
 * Download a tagged perl snapshot.
 * @param version The tag name of the snapshot.
 * @param cwd The path used to extract and build the snapshot.
 * @returns {Promise<string>} Resolves with the path after the download and extraction is complete.
 */
export async function dl_source(version: string, cwd: string): Promise<string> {
  //~ return new Promise(resolve => {
  const url = `https://github.com/Perl/perl5/archive/refs/tags/v${version}.zip`
  //~ https://github.com/Perl/perl5/archive/refs/tags/v5.39.8.zip
  //~ https://github.com/Perl/perl5/archive/refs/tags/v5.39.8.tar.gz
  let perl5ExtractedFolder = ''
  try {
    core.debug(`Downloading ${url}...`)

    const perl5Path = await tc.downloadTool(url, undefined /*, AUTH*/)
    core.info('Extract downloaded archive')
    perl5ExtractedFolder = await tc.extractTar(perl5Path, `${cwd}/extract`)
    core.debug(`Extracted to ${perl5ExtractedFolder}...`)

    //~ if (IS_WINDOWS) {
    //~ pythonExtractedFolder = await tc.extractZip(pythonPath);
    //~ } else {
    //~ pythonExtractedFolder = await tc.extractTar(pythonPath);
    //~ }

    //core.info('Execute installation script');
    //await installPerl(perl5ExtractedFolder);
    return perl5ExtractedFolder
  } catch (err) {
    if (err instanceof tc.HTTPError) {
      // Rate limit?
      if (err.httpStatusCode === 403 || err.httpStatusCode === 429) {
        core.info(
          `Received HTTP status code ${err.httpStatusCode}.  This usually indicates the rate limit has been exceeded`
        )
      } else {
        core.info(err.message)
      }
      if (err.stack) {
        core.debug(err.stack)
      }
    }
    throw err
  }
  //~ })
}
