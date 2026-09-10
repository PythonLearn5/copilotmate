import { useFrontendTool, useAgentContext } from "@copilotkit/react-core/v2";
import { z } from "zod";
import React from "react";
import Spreadsheet, { Matrix } from "react-spreadsheet";
import { canonicalSpreadsheetData } from "./canonicalSpreadsheetData";
import { Cell, SpreadsheetData, SpreadsheetRow } from "./type";
import { PreviewSpreadsheetChanges } from "./PreviewSpreadsheetChanges";

interface MainAreaProps {
  spreadsheet: SpreadsheetData;
  setSpreadsheet: (spreadsheet: SpreadsheetData) => void;
}

const SingleSpreadsheet = ({ spreadsheet, setSpreadsheet }: MainAreaProps) => {
  useAgentContext({
    description: "The current spreadsheet",
    value: JSON.stringify(spreadsheet),
  });

  useFrontendTool({
    name: "suggestSpreadsheetOverride",
    description: "Suggest an override of the current spreadsheet",
    parameters: z.object({
      rows: z.array(z.object({
        cells: z.array(z.object({
          value: z.string().describe("The value of the cell"),
        })).describe("The cells of the row"),
      })).describe("The rows of the spreadsheet"),
      title: z.string().describe("The title of the spreadsheet").optional(),
    }),
    render: (props) => {
      const { rows } = props.args as { rows: { cells: { value: string }[] }[] };
      const newRows = canonicalSpreadsheetData(rows);

      return (
        <PreviewSpreadsheetChanges
          preCommitTitle="Replace contents"
          postCommitTitle="Changes committed"
          newRows={newRows}
          commit={(rows) => {
            const updatedSpreadsheet: SpreadsheetData = {
              title: spreadsheet.title,
              rows: rows,
            };
            setSpreadsheet(updatedSpreadsheet);
          }}
        />
      );
    },
    handler: async () => {
      // Do nothing.
      // The preview component will optionally handle committing the changes.
    },
  });

  useFrontendTool({
    name: "appendToSpreadsheet",
    description: "Append rows to the current spreadsheet",
    parameters: z.object({
      rows: z.array(z.object({
        cells: z.array(z.object({
          value: z.string().describe("The value of the cell"),
        })).describe("The cells of the row"),
      })).describe("The new rows of the spreadsheet"),
    }),
    render: (props) => {
      const status = props.status;
      const { rows } = props.args as { rows: { cells: { value: string }[] }[] };
      const newRows = canonicalSpreadsheetData(rows);
      return (
        <div>
          <p>Status: {status}</p>
          <Spreadsheet data={newRows} />
        </div>
      );
    },
    handler: async ({ rows }: { rows: { cells: { value: string }[] }[] }) => {
      const canonicalRows = canonicalSpreadsheetData(rows);
      const updatedSpreadsheet: SpreadsheetData = {
        title: spreadsheet.title,
        rows: [...spreadsheet.rows, ...canonicalRows],
      };
      setSpreadsheet(updatedSpreadsheet);
    },
  });

  return (
    <div className="flex-1 overflow-auto p-5">
      <input
        type="text"
        value={spreadsheet.title}
        className="w-full p-2 mb-5 text-center text-2xl font-bold outline-none bg-transparent"
        onChange={(e) =>
          setSpreadsheet({ ...spreadsheet, title: e.target.value })
        }
      />
      <div className="flex items-start">
        <Spreadsheet
          data={spreadsheet.rows}
          onChange={(data) => {
            console.log("data", data);
            const rows = (data as Matrix<Cell>).map((row) =>
              row.map((cell) => cell ?? { value: "" })
            );
            setSpreadsheet({ ...spreadsheet, rows });
          }}
        />
        <button
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg ml-6 w-8 h-8 mt-0.5"
          onClick={() => {
            // add an empty cell to each row
            const spreadsheetRows = [...spreadsheet.rows];
            for (let i = 0; i < spreadsheet.rows.length; i++) {
              spreadsheet.rows[i].push({ value: "" });
            }
            setSpreadsheet({
              ...spreadsheet,
              rows: spreadsheetRows,
            });
          }}
        >
          +
        </button>
      </div>
      <button
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg w-8 h-8 mt-5 "
        onClick={() => {
          const numberOfColumns = spreadsheet.rows[0].length;
          const newRow: SpreadsheetRow = [];
          for (let i = 0; i < numberOfColumns; i++) {
            newRow.push({ value: "" });
          }
          setSpreadsheet({
            ...spreadsheet,
            rows: [...spreadsheet.rows, newRow],
          });
        }}
      >
        +
      </button>
    </div>
  );
};

export default SingleSpreadsheet;
