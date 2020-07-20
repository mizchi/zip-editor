/** @jsx h */
import "./_pre";
// @ts-ignore
import allzip from "!!file-loader!../all.zip";
import JSZip from "jszip";
import { render, h, Fragment } from "preact";
import { useRef, useState, useEffect } from "preact/hooks";
import path from "path";

class ZipFileSystem {
  static async ensureHandler() {
    const newHandler = await window.chooseFileSystemEntries();
    return newHandler;
  }

  static async startWithZip(zip: JSZip) {
    // const handler = (await this.ensureHandler()) as FileSystemHandle;
    // const file = await handler.getFile();
    // const zip = await new JSZip().loadAsync(file);
    return new ZipFileSystem(zip, null);
  }

  static async startWithHandler() {
    const handler = (await this.ensureHandler()) as FileSystemHandle;
    const file = await handler.getFile();
    const zip = await new JSZip().loadAsync(file);
    return new ZipFileSystem(zip, handler);
  }

  private constructor(
    private _zip: JSZip,
    private _handler: FileSystemHandle | null
  ) {}

  hasHandler() {
    return !!this._handler;
  }

  async save() {
    const result = await this._zip!.generateAsync({ type: "blob" });
    if (this._handler) {
      try {
        // @ts-ignore
        const writable = await this._handler.createWritable();
        await writable.write(result);
        await writable.close();
      } catch (err) {
        console.error(err);
      }
    }
  }

  async saveAs() {
    const result = await this._zip!.generateAsync({ type: "blob" });
    const newHandler = await window.chooseFileSystemEntries({
      type: "save-file",
      accepts: [
        {
          description: "Zip file",
          extensions: ["zip"],
          mimeTypes: ["text/plain"],
        },
      ],
    });

    try {
      // @ts-ignore
      const writable = await newHandler.createWritable();
      await writable.write(result);
      await writable.close();
    } catch (err) {
      console.error(err);
    }
  }

  async listFiles(): Promise<string[]> {
    return Object.keys(this._zip.files).map((a) => path.join("/", a));
  }

  async readFile(fpath: string) {
    const relpath = this.resolveToZipPath(fpath);
    return await this._zip.file(relpath)!.async("string");
  }

  async writeFile(fpath: string, content: string) {
    const relpath = this.resolveToZipPath(fpath);
    await this._zip.file(relpath, content);
  }

  resolveToZipPath(fpath: string) {
    return path.relative("/", fpath);
  }
}

function App() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [text, setText] = useState<string | null>(null);
  const [fs, setFs] = useState<ZipFileSystem | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const blob = await fetch(allzip).then((res) => res.blob());
      const zip = await new JSZip().loadAsync(blob);
      const fs = await ZipFileSystem.startWithZip(zip);
      const filenames = await fs.listFiles();

      setFs(fs);
      setSelectedFile(filenames[0]);
      setFiles(filenames);

      const t = await fs.readFile(filenames[0]);
      setText(t);

      // console.log(bn);
    })();
  }, []);
  return (
    <div>
      {fs != null && text != null && (
        <Fragment>
          <div>
            <select
              value={selectedFile!}
              onChange={async (ev) => {
                // @ts-ignore
                const x = ev.target.value;
                setSelectedFile(x);
                const newText = await fs.readFile(x);
                setText(newText);
              }}
            >
              {files.map((t) => {
                return (
                  <option key={t} value={t}>
                    {t}
                  </option>
                );
              })}
            </select>
          </div>
          <textarea
            ref={ref}
            value={text}
            onChange={async (ev) => {
              const content = ref.current.value;
              setText(content);
              await fs.writeFile(selectedFile!, content);
            }}
            style={{ width: "80vw", height: "60vh" }}
          />
        </Fragment>
      )}
      <div>
        <button
          disabled={!fs?.hasHandler()}
          onClick={async () => {
            const content = ref.current!.value;
            setText(content);
            if (fs) {
              await fs.save();
            }
          }}
        >
          save
        </button>
        <button
          onClick={async () => {
            const content = ref.current!.value;
            setText(content);
            if (fs) {
              await fs.saveAs();
            }
          }}
        >
          saveAs
        </button>
      </div>
      <div>
        <hr />
        <button
          onClick={async () => {
            const fs = await ZipFileSystem.startWithHandler();
            const filenames = await fs.listFiles();
            const filepath = filenames[0];
            const txt = await fs.readFile(filepath);

            setFs(fs);
            setText(txt);
            setFiles(filenames);
            setSelectedFile(filepath);
          }}
        >
          load
        </button>
      </div>
    </div>
  );
}

// const fs = new ZipFileSystem();
render(h(App, {}), document.body);
