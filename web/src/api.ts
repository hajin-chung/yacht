interface RotationData {
  result: number[];
  rotations: number[];
}

export async function getRotations(
  num: number,
  translations: number[],
  rotations: number[],
): Promise<RotationData> {
  const payload = { num, translations, rotations };

  // FIXME: currently test endpoint
  const res = await fetch("http://localhost:4434/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as RotationData;

  return data;
}
