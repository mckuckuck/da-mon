/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: table
 * Base block: table
 * Source: https://www.mongodb.com/resources/basics/databases/nosql-explained
 * Generated: 2026-06-11
 *
 * Inline wide-column comparison data table embedded in the article body. The
 * matched element is a real <table class="border-collapse"> wrapped in a
 * <figure class="table-container"> scroll container. Structure:
 *   <thead><tr><th>...</th> x5</tr></thead>   (columns: name, id, email, dob, city)
 *   <tbody><tr><td>...</td> x5</tr> ...</tbody> (data rows)
 * Each header/data cell's text is wrapped in an inner <span> (hashed css-*).
 * Some data cells are empty (e.g. dob in row 1, city in row 2).
 *
 * Target block (blocks/table/table.js, standard EDS Table): the block's
 * decorate() turns authored rows/cells into a real <table> — the first
 * authored row becomes <thead>/<th>, remaining rows become <tbody>/<td>, and
 * each cell in a row maps to a column. createBlock() prepends the "Table"
 * name row automatically, so cells here = [headerRow, ...dataRows] where each
 * row is an array of column cells mirroring the source <th>/<td> contents.
 */
export default function parse(element, { document }) {
  // `element` is the matched <table.border-collapse>. Be defensive in case the
  // matched element is the surrounding figure/wrapper rather than the table.
  const table = element.matches('table') ? element : element.querySelector('table');

  // Reads a cell's content, unwrapping the inner styling <span> when present so
  // we carry the meaningful inline content (text + any inline links) and not the
  // hashed css-* span wrapper. Falls back to trimmed text for empty cells.
  const cellContent = (sourceCell) => {
    if (!sourceCell) return '';
    // Prefer the inner span(s) that hold the actual text/inline content.
    const spans = sourceCell.querySelectorAll(':scope > span');
    if (spans.length === 1) {
      const text = (spans[0].textContent || '').trim();
      // If the span has element children (e.g. links), keep the element;
      // otherwise emit clean trimmed text so stray whitespace/newlines collapse.
      return spans[0].children.length ? spans[0] : text;
    }
    if (spans.length > 1) {
      return Array.from(spans);
    }
    // No span wrapper: keep element children if any, else trimmed text.
    return sourceCell.children.length ? sourceCell : (sourceCell.textContent || '').trim();
  };

  const cells = [];

  // Header row: the <thead> <th> cells define the columns.
  const headerCells = table
    ? Array.from(table.querySelectorAll(':scope > thead > tr > th'))
    : [];
  if (headerCells.length) {
    cells.push(headerCells.map((th) => cellContent(th)));
  }

  // Data rows: each <tbody> <tr> contributes a row of <td> column cells.
  const bodyRows = table
    ? Array.from(table.querySelectorAll(':scope > tbody > tr'))
    : [];
  bodyRows.forEach((tr) => {
    const rowCells = Array.from(tr.querySelectorAll(':scope > td')).map((td) => cellContent(td));
    if (rowCells.length) cells.push(rowCells);
  });

  // Fallback: handle tables without explicit thead/tbody (rows directly under
  // <table> or <tr>s elsewhere). First such row is treated as the header.
  if (!cells.length && table) {
    const allRows = Array.from(table.querySelectorAll('tr'));
    allRows.forEach((tr) => {
      const rowCells = Array.from(tr.querySelectorAll(':scope > th, :scope > td')).map(
        (c) => cellContent(c),
      );
      if (rowCells.length) cells.push(rowCells);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table', cells });
  element.replaceWith(block);
}
