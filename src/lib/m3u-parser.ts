export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  referrer: string;
}

export function parseM3U(content: string): Channel[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const channels: Channel[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF:')) {
      const info = lines[i];
      let url = '';
      let referrer = '';

      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('#EXTVLCOPT:http-referrer=')) {
          referrer = lines[j].replace('#EXTVLCOPT:http-referrer=', '');
        } else if (!lines[j].startsWith('#')) {
          url = lines[j];
          break;
        }
      }
      if (!url) continue;

      const nameMatch = info.match(/,(.+)$/);
      const logoMatch = info.match(/tvg-logo="([^"]*)"/);
      const groupMatch = info.match(/group-title="([^"]*)"/);

      channels.push({
        id: `ch-${channels.length}`,
        name: nameMatch?.[1]?.trim() || 'Unknown',
        logo: logoMatch?.[1] || '',
        group: groupMatch?.[1] || 'Uncategorized',
        url,
        referrer,
      });
    }
  }

  return channels;
}

export async function fetchAndParseM3U(playlistUrl: string): Promise<Channel[]> {
  const res = await fetch(playlistUrl);
  let text = await res.text();

  // Some playlists are wrapped inside an HTML <pre>...</pre> block.
  // Extract the M3U content if so.
  const preMatch = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (preMatch) {
    text = preMatch[1];
  } else {
    const extIdx = text.indexOf('#EXTINF');
    if (extIdx > 0 && /<[a-z!]/i.test(text.slice(0, extIdx))) {
      text = text.slice(extIdx);
    }
  }

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return parseM3U(text);
}
