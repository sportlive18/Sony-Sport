export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  referrer: string;
  userAgent?: string;
}

export function parseM3U(content: string): Channel[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const channels: Channel[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF:')) {
      const info = lines[i];
      let url = '';
      let referrer = '';
      let userAgent = '';

      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('#EXTVLCOPT:http-referrer=')) {
          referrer = lines[j].replace('#EXTVLCOPT:http-referrer=', '');
        } else if (lines[j].startsWith('#EXTVLCOPT:http-user-agent=')) {
          userAgent = lines[j].replace('#EXTVLCOPT:http-user-agent=', '');
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
        userAgent,
      });
    }
  }

  return channels;
}

export async function fetchAndParseM3U(playlistUrl: string): Promise<Channel[]> {
  const res = await fetch(playlistUrl);
  let text = await res.text();

  // Handle HTML wrapped M3U (common in some free providers)
  if (text.includes('<pre>') && text.includes('</pre>')) {
    const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (match) {
      text = match[1].trim();
    }
  }

  return parseM3U(text);
}
