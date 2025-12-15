import RNFS from 'react-native-fs';

type Variant = {
    resolution: string;
    infoLine: string;
    uriLine: string;
};

export async function createResolutionPlaylistsRN(
    manifestUrl: string,
    filesDir: string = RNFS.DocumentDirectoryPath
): Promise<string[]> {
    const manifest = await fetch(manifestUrl).then(r => r.text());
    const lines = manifest.split('\n');

    const audioLines = lines.filter(
        l => l.startsWith('#EXT-X-MEDIA') && l.includes('TYPE=AUDIO')
    );

    const variantMap = new Map<string, Variant>();

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
            const infoLine = lines[i];
            const uriLine = lines[i + 1];
            const res = infoLine.match(/RESOLUTION=(\d+x\d+)/)?.[1];

            if (!res || !uriLine) continue;

            if (!variantMap.has(res)) {
                variantMap.set(res, { resolution: res, infoLine, uriLine });
            }
        }
    }

    // sort by resolution width (ascending)
    const uniqueVariants = Array.from(variantMap.values()).sort(
        (a, b) =>
            Number(a.resolution.split('x')[0]) -
            Number(b.resolution.split('x')[0])
    );

    for (const v of uniqueVariants) {
        const content = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '',
            ...audioLines,
            '',
            v.infoLine,
            v.uriLine,
            ''
        ].join('\n');

        const filePath = `${filesDir}/${v.resolution}.m3u8`;
        await RNFS.writeFile(filePath, content, 'utf8');
    }

    return uniqueVariants.map(v => v.resolution);
}

