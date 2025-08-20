

export const currentScope = (scope) => {
  console.log('scope:',scope)
  const scopes = {
    all: {
      title: "bible access list",
      domain: "https://bibleaccesslist.org",
      apiLiveUrl: "https://arc.dbs.org/api",
      locales: {
        en: "English",
        es: "Español",
        zh: "中国人"
      },
    }
  };

  return scopes[scope];
};

export const SITE = currentScope("all");

export function getLanguageFromPath(URL) {
  const lang = URL.pathname.split("/")[1];
  return lang;
}
