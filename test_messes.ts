import { fetchMesses } from './src/lib/platformData.ts';

async function test() {
  try {
    const m = await fetchMesses(true);
    console.log(JSON.stringify(m[0], null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
