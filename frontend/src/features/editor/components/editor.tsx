import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  tablePlugin,
  thematicBreakPlugin,
  linkPlugin,
  toolbarPlugin,
  linkDialogPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  ListsToggle,
  UndoRedo,
  InsertTable,
  InsertCodeBlock,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEffect, useState } from "react";
import {
  createFile,
  deleteFile,
  editFile,
  getFile,
  triggerFileDownload,
} from "../services";
import { Plus, Printer, Save, Trash2, Undo2 } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "react-toastify";
import PacmanLoader from "react-spinners/PacmanLoader";

function App() {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const fetchFile = async () => {
      const data = await getFile(searchParams.get("editing") ?? "");
      setMarkdown(data.markdown ?? "");
      setFileName(data.name);
      setLoading(false);
    };

    setLoading(true);
    fetchFile();
  }, [searchParams.get("editing")]);

  const languages = {
    js: "JavaScript",
    jsx: "React",
    tsx: "React TypeScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    css: "CSS",
    html: "HTML",
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      createFile(markdown);
    }
  });

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <PacmanLoader />
      </div>
    );
  }

  return (
    <div className="text-left w-full h-screen">
      <MDXEditor
        markdown={markdown}
        onChange={setMarkdown}
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [2, 3, 4, 5, 6] }),
          listsPlugin(),
          quotePlugin(),
          markdownShortcutPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
          codeMirrorPlugin({
            codeBlockLanguages: languages,
          }),
          tablePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          frontmatterPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap gap-2">
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <CreateLink />
                <InsertTable />
                <ListsToggle />
                <ConditionalContents
                  options={[
                    {
                      when: (editor) => editor?.editorType === "codeblock",
                      contents: () => <ChangeCodeMirrorLanguage />,
                    },
                    {
                      fallback: () => (
                        <>
                          <InsertCodeBlock />
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          }),
          linkDialogPlugin(),
          diffSourcePlugin({
            diffMarkdown: markdown,
            viewMode: "rich-text",
          }),
        ]}
        contentEditableClassName="prose max-w-full text-left min-h-[300px] p-4 px-12"
      />
      {fileName !== "" ? (
        <div className="absolute bottom-5 ml-5 opacity-50">
          {"Currently editing: " + fileName}
        </div>
      ) : (
        <div></div>
      )}
      <div className="absolute bottom-5 right-5 flex gap-3">
        <div
          onClick={async () => triggerFileDownload(markdown)}
          className="rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer"
        >
          <Printer></Printer>
        </div>
        <div
          // TODO: CLEAR BUTTON FUNCTIONALITY
          onClick={async () => {
            setLoading(true);
            const folder = searchParams.get("folder");
            await setSearchParams(folder ? { folder } : new URLSearchParams());
            setMarkdown("");
            setLoading(false);
            toast(`Note cleared!`);
          }}
          className="rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer"
        >
          <Undo2></Undo2>
        </div>
        <div
          onClick={async () => {
            const id = searchParams.get("editing");
            if (id === null) {
              setLoading(true);
              const parent = await createFile(markdown);
              setMarkdown("");
              setLoading(false);
              toast(`Your note was created in ${parent.parent}!`);
            } else {
              setLoading(true);
              await editFile(id, markdown);
              setLoading(false);
              setSearchParams({});
              toast("Your note was successfully edited!");
            }
          }}
          className="rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer"
        >
          {searchParams.get("editing") === null ? <Plus /> : <Save />}
        </div>
        {searchParams.get("editing") === null ? (
          <div></div>
        ) : (
          <div
            onClick={() => {
              const elem = document.getElementById("delete_modal");

              if (elem) {
                (
                  document.getElementById("delete_modal") as HTMLDialogElement
                )?.show();
                elem.style.display = "flex";
              }
            }}
            className="rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer "
          >
            <Trash2 />
          </div>
        )}
      </div>
      <dialog
        onClick={() => {
          const elem = document.getElementById("delete_modal");

          if (elem) {
            (
              document.getElementById("delete_modal") as HTMLDialogElement
            )?.close();
            elem.style.display = "none";
          }
        }}
        id="delete_modal"
        className="absolute left-0 top-0 z-50 w-full h-full bg-gray-500/50 overflow-y-hidden overflow-x-hidden d-flex items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-50  text-black p-8 text-left rounded-md w-1/3"
        >
          <h2 className="text-xl">
            Are you sure you want to delete this file?
          </h2>
          <h2 className="text-base mt-2">
            This action is permanent and cannot be undone.
          </h2>
          <div className="flex flex-row gap-5 mt-5 justify-end">
            <div
              onClick={async () => {
                await deleteFile(searchParams.get("editing") || "");
                (
                  document.getElementById("delete_modal") as HTMLDialogElement
                )?.close();
                const elem = document.getElementById("delete_modal");
                if (elem) {
                  elem.style.display = "none";
                }
                await setSearchParams({});
                await setMarkdown("");
                toast("Your note was successfully deleted!");
              }}
              className="rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer"
            >
              <Trash2 />
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default App;
