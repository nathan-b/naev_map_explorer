/**
 * Get the contents of the given path of the given repository.
 *
 * @param repo  The repository (in user/repo format. Example: naev/naev)
 * @param path  The path within the repository (example: dat/missions)
 * @param callback  Callback to fire with the data
 *
 * @returns  An array of file objects.
 *
 * File objects contain the following fields:
    "git_url",
    "html_url",
    "download_url",
    "name",
    "path",
    "sha",
    "size",
    "type",
    "url",
    "content",
    "encoding"
 */
function get_repo_dir(repo, path, callback) {
  const apiUrl = "https://api.github.com/repos";
  const repoUrl = "naev/naev";

  // XXX TODO Handle pagination
  const contentsUrl = `${apiUrl}/${repoUrl}/contents/${path}`;
  console.log(contentsUrl);
  fetch(contentsUrl, {
    headers: {
      "Accept": "application/vnd.github.v3+json"
    }
  }).then(async (response) => {
  	console.log("Got response");
  	if (response.ok) {
    	console.log("Calling callback");
  		callback(await response.json());
    } else {
    	console.error(response.statusText);
    }
  });
}

module.exports = { get_repo_dir };