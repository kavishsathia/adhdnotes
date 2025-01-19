import "@mdxeditor/editor/style.css";
import { useEffect, useState } from "react";
import { AdhdFile } from "../types";
import Card from "./card";
import { createFolder, getFile, getFiles } from "../services";
import { ArrowLeft, Folder, Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import { PacmanLoader } from "react-spinners";

function App() {
  const [notes, setNotes] = useState<AdhdFile[]>([]);
  const [folder, setFolder] = useState<AdhdFile | null>();
  const [name, setName] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      console.log(searchParams.get("folder"));
      const data = await getFiles(searchParams.get("folder"));

      const folderId = searchParams.get("folder");
      if (folderId !== null) {
        const folder = await getFile(folderId);

        if (folder.parentId === null) {
          setFolder({ id: "", name: "Home", markdown: null, parentId: null });
        } else if (folder.parentId !== null) {
          const parent = await getFile(folder.parentId);
          setFolder(parent);
        }
      } else {
        setFolder(null);
      }

      setNotes(data);
      setLoading(false);
    };

    fetchFiles();
  }, [searchParams.get("folder")]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <PacmanLoader />
      </div>
    );
  }

  return (
    <div>
      <dialog
        onClick={() => {
          const elem = document.getElementById("name_modal");

          if (elem) {
            (
              document.getElementById("name_modal") as HTMLDialogElement
            )?.close();
            elem.style.display = "none";
          }
        }}
        id="name_modal"
        className="z-50 w-full h-full bg-gray-500/50 overflow-y-hidden items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-50 text-black p-8 text-left rounded-md w-1/3"
        >
          <h2 className="text-xl">Name your folder</h2>
          <h2 className="text-base mt-2">
            Give it a thoughful name, we'll be using it to organise your notes
            later on
          </h2>
          <div className="flex flex-row gap-5 mt-5">
            <input
              type="text"
              id="first_name"
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
              focus:ring-blue-500 focus:border-blue-500 block 
              w-full p-2.5 dark:placeholder-gray-400
              dark:focus:ring-blue-500"
              placeholder="Search for a file in this directory..."
              required
            />
            <div
              onClick={async () => {
                await createFolder(name, searchParams.get("folder") ?? null);
                (
                  document.getElementById("name_modal") as HTMLDialogElement
                )?.close();
              }}
              className="rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer"
            >
              <Plus />
            </div>
          </div>
        </div>
      </dialog>
      <div className="p-5 flex flex-row gap-5">
        <input
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          id="first_name"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg
           focus:ring-blue-500 focus:border-blue-500 block 
           w-full p-2.5 dark:placeholder-gray-400
           dark:focus:ring-blue-500"
          placeholder="Search for a file in this directory..."
          required
        />
        <div
          onClick={() => {
            const elem = document.getElementById("name_modal");

            if (elem) {
              (
                document.getElementById("name_modal") as HTMLDialogElement
              )?.show();
              elem.style.display = "flex";
            }
          }}
          className="rounded-md bg-slate-600 text-white p-3 hover:bg-slate-900 cursor-pointer"
        >
          <Folder />
        </div>
      </div>
      {folder && (
        <div className="flex flex-row items-center gap-2 px-5 pt-3 cursor-pointer hover:underline">
          <ArrowLeft />
          <p
            className="text-left inline-block"
            onClick={() => {
              if (folder.id === "") {
                searchParams.delete("folder");
              } else {
                searchParams.set("folder", folder.id);
              }
              setSearchParams(searchParams);
            }}
          >
            Back to {folder.name}
          </p>
        </div>
      )}

      <p className="text-2xl text-left p-5 pb-0">Folders</p>
      <div className="text-left w-full h-full grid grid-cols-3 gap-5 p-5">
        {notes
          .filter((x) => x.markdown === null)
          .filter((x) => x.name.toLowerCase().includes(search.toLowerCase()))
          .map((note) => {
            return <Card file={note}></Card>;
          })}
      </div>
      <p className="text-2xl text-left p-5 pb-0">Files</p>
      <div className="text-left w-full h-full grid grid-cols-3 gap-5 p-5">
        {notes
          .filter((x) => x.markdown !== null)
          .filter((x) => x.name.toLowerCase().includes(search.toLowerCase()))
          .map((note) => {
            return <Card file={note}></Card>;
          })}
      </div>
    </div>
  );
}

export default App;
