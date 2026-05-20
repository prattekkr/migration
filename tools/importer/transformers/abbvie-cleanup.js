/* eslint-disable */
export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const { document } = payload;
  ['#onetrust-consent-sdk','.experiencefragment','.cmp-experiencefragment--header','.cmp-experiencefragment--footer','header.nav-bar','.button.back-to-top','link[href]','noscript','script','style','.sticky-nav'].forEach(sel => { document.querySelectorAll(sel).forEach(el => el.remove()); });
}
