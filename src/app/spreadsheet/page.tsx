"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Spreadsheet/Sidebar";
import SingleSpreadsheet from "@/components/Spreadsheet/SingleSpreadsheet";
import { useFrontendTool, useAgentContext, useConfigureSuggestions, CopilotSidebar } from "@copilotkit/react-core/v2";
import type { CSSProperties } from "react";
import { z } from "zod";
import { canonicalSpreadsheetData } from "@/components/Spreadsheet/canonicalSpreadsheetData";
import { SpreadsheetData } from "@/components/Spreadsheet/type";
import { PreviewSpreadsheetChanges } from "@/components/Spreadsheet/PreviewSpreadsheetChanges";

const HomePage = () => {
  useConfigureSuggestions(
    {
      instructions: "Suggest the most relevant actions related to spreadsheet.",
    },
  );
  return (
    <div
      style={
        {
          "--copilot-kit-primary-color": "#222222",
          "--copilot-kit-background-color": "#555555",
          "--copilot-kit-response-button-background-color": "#444444",
          "--copilot-kit-response-button-color": "#fff",
          "--copilot-kit-separator-color": "#666666",
          "--copilot-kit-muted-color": "#fff",
        } as CSSProperties
      }
    >
      <CopilotSidebar
        labels={{
          welcomeMessageText:
            "Welcome to the AI-assisted spreadsheet! How can I help you?",
        }}
        defaultOpen={true}
      >
        {() => <Main />}
      </CopilotSidebar>
    </div>
  );
};

const Main = () => {
  const [spreadsheets, setSpreadsheets] = React.useState<SpreadsheetData[]>([
    {
      title: "Spreadsheet 1",
      rows: [
        [{ value: "" }, { value: "" }, { value: "" }],
        [{ value: "" }, { value: "" }, { value: "" }],
        [{ value: "" }, { value: "" }, { value: "" }],
      ],
    },
  ]);

  const [selectedSpreadsheetIndex, setSelectedSpreadsheetIndex] = useState(0);

  useFrontendTool({
    name: "createSpreadsheet",
    description: "Create a new  spreadsheet",
    parameters: z.object({
      rows: z.array(z.object({
        cells: z.array(z.object({
          value: z.string().describe("The value of the cell"),
        })).describe("The cells of the row"),
      })).describe("The rows of the spreadsheet"),
      title: z.string().describe("The title of the spreadsheet").optional(),
    }),
    render: (props) => {
      const { rows, title } = props.args as { rows: { cells: { value: string }[] }[]; title?: string };
      const newRows = canonicalSpreadsheetData(rows);

      return (
        <PreviewSpreadsheetChanges
          preCommitTitle="Create spreadsheet"
          postCommitTitle="Spreadsheet created"
          newRows={newRows}
          commit={(rows) => {
            const newSpreadsheet: SpreadsheetData = {
              title: title || "Untitled Spreadsheet",
              rows: rows,
            };
            setSpreadsheets((prev) => [...prev, newSpreadsheet]);
            setSelectedSpreadsheetIndex(spreadsheets.length);
          }}
        />
      );
    },
    handler: async () => {
      // Do nothing.
      // The preview component will optionally handle committing the changes.
    },
  });

  useAgentContext({
    description: "Today's date",
    value: new Date().toLocaleDateString(),
  });

  return (
    <div className="flex">
      <Sidebar
        spreadsheets={spreadsheets}
        selectedSpreadsheetIndex={selectedSpreadsheetIndex}
        setSelectedSpreadsheetIndex={setSelectedSpreadsheetIndex}
      />
      <SingleSpreadsheet
        spreadsheet={spreadsheets[selectedSpreadsheetIndex]}
        setSpreadsheet={(spreadsheet) => {
          setSpreadsheets((prev) => {
            console.log("setSpreadsheet", spreadsheet);
            const newSpreadsheets = [...prev];
            newSpreadsheets[selectedSpreadsheetIndex] = spreadsheet;
            return newSpreadsheets;
          });
        }}
      />
    </div>
  );
};

export default HomePage;
