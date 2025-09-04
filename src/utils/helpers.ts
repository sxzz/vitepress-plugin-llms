import prettyBytes from 'pretty-bytes'

/**
 * Returns a human-readable string representation of the given string's size in bytes.
 *
 * This function calculates the byte size of a given string by creating a `Blob`
 * and then converts it into a human-readable format using `byte-size`.
 *
 * @param string - The input string whose size needs to be determined.
 * @returns A human-readable size string (e.g., "1.2 KB", "500 B").
 */
export const getHumanReadableSizeOf = (string: string): string =>
	prettyBytes(Buffer.byteLength(string, 'utf8'))
