#!/usr/bin/env node
// Wire navbar-togglers to their .collapse.navbar-collapse targets so that
// Bootstrap's collapse JS can actually toggle the menu at narrow viewports.
// The data-compare-key="nav-N-toggler" / data-compare-key="nav-N-collapse"
// pattern gives us a stable id slug to use.
import { readFile, writeFile } from 'node:fs/promises';

const FILES = [
  'apps/docs/src/pages/compare/example-navbars/reference.astro',
  'apps/docs/src/pages/compare/example-navbars/wc.astro',
  'apps/docs/src/pages/compare/example-navbars-offcanvas/reference.astro',
  'apps/docs/src/pages/compare/example-navbars-offcanvas/wc.astro',
];

for (const f of FILES) {
  let body = await readFile(f, 'utf8');

  // Wire <button class="navbar-toggler" ... data-compare-key="<key>-toggler">
  // to its sibling .collapse.navbar-collapse with data-compare-key="<key>-collapse".
  body = body.replace(
    /<button class="navbar-toggler" type="button" aria-label="Toggle navigation" data-compare-key="([^"]+)-toggler">/g,
    (_m, key) =>
      `<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#${key}-collapse" aria-controls="${key}-collapse" aria-expanded="false" aria-label="Toggle navigation" data-compare-key="${key}-toggler">`,
  );

  // Add id on each .collapse.navbar-collapse[*] div whose data-compare-key
  // ends with "-collapse". Skip ones that already have an id.
  body = body.replace(
    /<div class="(collapse navbar-collapse(?:[^"]*)?)"(?! [^>]*\bid=)([^>]*?)data-compare-key="([^"]+)-collapse">/g,
    (_m, cls, mid, key) =>
      `<div class="${cls}" id="${key}-collapse"${mid}data-compare-key="${key}-collapse">`,
  );

  // Wire offcanvas togglers similarly: data-compare-key="<key>-toggler"
  // paired with data-compare-key="<key>-offcanvas" using data-bs-toggle="offcanvas".
  // Only applies if there's a sibling element with -offcanvas key (offcanvas page).
  // First: rewrite the toggler attributes for offcanvas-targeted ones we
  // recognize by their key prefix (oc-*).
  body = body.replace(
    /<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#(oc-[^"]*)-collapse" aria-controls="\1-collapse" aria-expanded="false" aria-label="Toggle navigation" data-compare-key="\1-toggler">/g,
    (_m, key) =>
      `<button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#${key}-offcanvas" aria-controls="${key}-offcanvas" aria-label="Toggle navigation" data-compare-key="${key}-toggler">`,
  );

  await writeFile(f, body, 'utf8');
  console.log(`wired ${f}`);
}
