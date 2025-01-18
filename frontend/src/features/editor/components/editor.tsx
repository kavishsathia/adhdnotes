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
import { createFile, editFile, getFile } from "../services";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "react-toastify";
import PacmanLoader from "react-spinners/PacmanLoader";

function App() {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchFile = async () => {
      const data = await getFile(searchParams.get("editing") ?? "");
      setMarkdown(data.markdown ?? "");
      setLoading(false);
    };

    setLoading(true);
    fetchFile();
  }, [searchParams]);

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
            editFile(id, markdown);
            toast("Your note was edited!");
          }
        }}
        className="absolute bottom-5 right-5 rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer"
      >
        <Plus />
      </div>
    </div>
  );
}

export default App;
