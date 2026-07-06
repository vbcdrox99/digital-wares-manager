async function test() {
  const page = "Liquipedia:Matches/June_2026";
  const apiUrl = `https://liquipedia.net/dota2/api.php?action=parse&page=${encodeURIComponent(page)}&format=json`
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Dota Play (admin@dotaplay.com)',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    if (data.error) {
      console.log(`Page "${page}" does not exist! Error:`, data.error.info);
    } else {
      console.log(`Page "${page}" EXISTS!`);
      const htmlContent = data?.parse?.text?.['*'];
      const count = htmlContent.split('match-info').length - 1;
      console.log(`Found ${count} occurrences of "match-info" in the page.`);
    }
  } catch (e) {
    console.error(e);
  }
}

test();
