import type { AsyncFunctionArguments } from '@actions/github-script'

/**
 * This function checks if CI workflow has already run on the current commit.
 * If not, it signals that tests should be run.
 */
export default async ({ context, github, core }: AsyncFunctionArguments) => {
	// Get current commit SHA
	const current_commit_sha = context.sha
	console.log(
		`Checking if CI has already run for commit: ${current_commit_sha}`,
	)

	// Get the CI workflow path from environment variables
	const { CI_WORKFLOW_PATH } = process.env

	if (!CI_WORKFLOW_PATH) {
		console.error('CI_WORKFLOW_PATH environment variable is not set')
		// If we can't determine which workflow to check, run the tests to be safe
		return core.setOutput('should-run-tests', 'true')
	}

	try {
		// Fetch all successful workflow runs for the repository
		const workflows = await github.rest.actions.listWorkflowRunsForRepo({
			owner: context.repo.owner,
			repo: context.repo.repo,
			status: 'success',
		})

		// Check if any successful CI workflow run exists for the current commit
		const ciRun = workflows.data.workflow_runs.find(
			(run) =>
				run.path === CI_WORKFLOW_PATH &&
				run.head_sha === current_commit_sha &&
				run.conclusion === 'success',
		)

		if (ciRun) {
			// CI has already run successfully on this commit
			console.log(
				`CI workflow has already run successfully on commit ${current_commit_sha}`,
			)
			return core.setOutput('should-run-tests', 'false')
		}
		// No successful CI run found for this commit
		console.log(
			`No successful CI run found for commit ${current_commit_sha}, will run tests`,
		)
		return core.setOutput('should-run-tests', 'true')
	} catch (error) {
		// If there's an error accessing the GitHub API, run the tests to be safe
		console.error(`Error checking workflow runs: ${error}`)
		return core.setOutput('should-run-tests', 'true')
	}
}
