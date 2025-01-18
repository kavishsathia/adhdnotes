import "@mdxeditor/editor/style.css";
import { AdhdFile } from "../types";
import { File, Folder } from "lucide-react";
import { useSearchParams } from "react-router";

function App({ file }: { file: AdhdFile }) {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div
      onClick={() => {
        if (file.markdown == null) {
          searchParams.set("folder", String(file.id));
          setSearchParams(searchParams);
        } else {
          searchParams.set("editing", String(file.id));
          setSearchParams(searchParams);
        }
      }}
      className="text-left w-full h-fit bg-slate-300 rounded-md flex flex-row items-center p-3 gap-2 
    hover:shadow-md duration-200 cursor-pointer"
    >
      {file.markdown !== null ? (
        <File className="flex-shrink-0" />
      ) : (
        <Folder className="flex-shrink-0" />
      )}

      <div>
        <div className="text-lg line-clamp-1">{file.name}</div>
      </div>
    </div>
  );
}

export default App;
