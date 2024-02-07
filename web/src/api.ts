interface SimulationData {
  result: number[];
  buffer: number[];
}

export async function getSimulation(num: number): Promise<SimulationData> {
  const payload = { num };

  // FIXME: currently test endpoint
  const res = await fetch("http://localhost:4434/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as SimulationData;

  return data;
}
