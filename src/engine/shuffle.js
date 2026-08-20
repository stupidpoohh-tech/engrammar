// 셔플.
//
// 구버전은 시드가 문제 위치 하나뿐이라 같은 챕터를 몇 번 풀어도 카드 배치가 똑같았다.
// 두 번째 풀이부터는 문법이 아니라 카드 자리를 외우게 된다. 그래서 시도마다 새로 섞는다.
// 테스트에서는 rand 를 주입해 결과를 고정한다.

export function shuffle(list, rand = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 원래 순서와 같게 나오면 한 번 더 섞는다 (2개 이상일 때). */
export function shuffleDistinct(list, rand = Math.random) {
  if (list.length < 2) return [...list];
  for (let tries = 0; tries < 5; tries++) {
    const out = shuffle(list, rand);
    if (out.some((v, i) => v !== list[i])) return out;
  }
  return shuffle(list, rand);
}
