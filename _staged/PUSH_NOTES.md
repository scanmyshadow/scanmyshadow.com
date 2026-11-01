# Push runbook (batches 5+)
- Render date = push day; folder auto = blog/2026/<MM>.
- Registry: published.json + current batch slugs -> /tmp/claude-0/regN.json (URLs use 2026/<MM>).
- integrate.py <mainwt> <outdir> <batch_index> <date>; audit.py from mainwt.
- Relink earlier batches with ORIGINAL dates: idx0 2026-10-27, idx1 2026-10-28, idx2 2026-10-29, idx3 2026-11-02, idx4 = its push date.
- gen_wave.py fixed 2 Nov (mixed paragraph+list blocks, nested bullets). Relink will update live uk-7726-how-to-report-scam-texts-calls (idx1) and uk-autotrader-car-selling-scams (idx2) — expected diffs, check they only touch list markup + dateModified.
- After push: update published.json with batch URLs; sync _staged; URL list file for GSC/Bing.
