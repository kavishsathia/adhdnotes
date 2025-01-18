import { Link } from "react-router";
import Editor from "../components/editor";
import Filesystem from "../components/filesystem";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <div className="w-screen h-screen bg-neutral-50 flex flex-col">
      <div className="h-12 w-full flex justify-center items-center border-b-2 border-neutral-200 flex-shrink-0 px-5 bg-slate-700">
        <Link to="/">
          <img className="h-6 w-auto" src="/logo.png" alt="Logo" />
        </Link>
      </div>

      <div className="w-full grid grid-cols-6 flex-1 overflow-hidden overscroll-contain">
        <div className="border-r col-span-3 border-gray-200 hidden lg:block bg-slate-100">
          <Filesystem />
        </div>

        <div className="lg:col-span-3 col-span-6 overflow-y-auto overscroll-contain">
          <Editor />
        </div>
      </div>
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;
