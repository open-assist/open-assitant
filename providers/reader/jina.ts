export class Jina {
  static MATCHER = /http[s]?\:\/\//;

  static async read(url: string): Promise<{ title: string; content: string }> {
    return await fetch(`https://r.jina.ai/${url}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-With-Links-Summary": "true",
        "X-With-Images-Summary": "true",
        "X-With-Generated-Alt": "true",
      },
    }).then((r) => r.json())
      .then((body) => {
        if (body["code"] === 200) {
          return body["data"];
        }
      });
  }
}
