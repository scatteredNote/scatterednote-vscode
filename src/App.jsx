import * as React from 'react';
import './App.css';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import CreatableSelect from 'react-select/creatable';
import { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import * as commands from '@uiw/react-md-editor/lib/commands';

import logo from './logo.svg';

const t2 = (() => {
  const languages = ['js', 'rust', 'ts', 'php', 'bash'];
  const output = [];
  const shortcuts = {
    js: 'cmd+j',
    rust: 'cmd+r',
    ts: 'cmd+shift+t',
    php: 'cmd+shift+p',
    bash: 'cmd+sh',
  };

  for (const l of languages) {
    output.push({
      name: `${l}`,
      keyCommand: `${l}`,
      buttonProps: { 'aria-label': `${l}` },
      shortcuts: `${shortcuts[l]}`,
      icon: <span>{l}</span>,
      execute: (state, api) => {
        let modifyText = `\`\`\`${l}\n ${state.selectedText} \n\`\`\`\n `;
        if (!state.selectedText) {
          modifyText = `\`\`\`${l}\n\n \`\`\` `;
        }
        api.replaceSelection(modifyText);
      },
    });
  }
  return output;
})();

const options = [
  { label: "economics", value: "Economics" },
  { label: "machine", value: "Machine" },
  { label: "philosophy", value: "Philosophy" }
];

export default function App() {
  //Todo reduce the number of state
  const [value, setValue] = useState('**Hello world!!!**');
  const [views, setViews] = useState('**Store Views!!!**');
  const [isPublic, setIsPublic] = useState(true);
  const [valueOp, setValueOp] = useState([]);
  const [mainTopic, setMainTopic] = useState()
  const [subTopic, setSubTopic] = useState()
  const [note, setNote] = useState()
  // static state only updated during loading
  const [username, setUsername] = useState({username: "", accessToken: ""})
  const [data, setData] = useState([]) 
  const [directoryStructure, setDirectoryStructure] = useState([])
  const [tags, setTags] = useState([])
  const [err, setErr] = useState(null)
  const commitState = useRef(null)

  useEffect(() => {

    // Add event listener to listen for the 'message' event
    window.addEventListener('message', async (event) => {
      const message = event.data
        switch(message.type) {
          case "username":
            console.log("message value: ", message.value)
            setUsername(JSON.parse(message.value))
            return;
        }
    });

    tsvscode.postMessage({ type: 'username', value: undefined });

    return () => {
      // Clean up the event listener when the component unmounts
      window.removeEventListener('message', async (event) => {
        const message = event.data
          switch(message.type) {
            case "username":
              setUsername(JSON.parse(message.value))
              return;
          }
      });
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/userdirectory?username=${username.username}`);
        const {data, directoryStructure, tags} = await response.json();
        setData(data)
        setDirectoryStructure(directoryStructure)
        setTags(tags)
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (username.username) {
      fetchData();
    }
  }, [username]);

  const handleToggle = () => {
    setIsPublic(!isPublic);
  };

  const notes = () => {
    if (subTopic && directoryStructure[subTopic.value]) {
      if (directoryStructure[subTopic.value].files.length > 0) {
        return directoryStructure[subTopic.value].files
      } 
      else {
        return []
      }
    }
   
    if (mainTopic && directoryStructure[mainTopic.value]) {
      if (directoryStructure[mainTopic.value].files.length > 0) {
        return directoryStructure[mainTopic.value].files
      } 
      else {
        return []
      }
    }
    return []
  }

  const handleCommit = () => {
    //get all necessary state
    if (mainTopic?.label && note?.label) {
      setErr(null)
      const data = {
        MainTopic: mainTopic.value,
        SubTopic: subTopic?.label,
        note: note.label,
        grab: value,
        views: views,
        isPublic: isPublic,
        user: username.username,
        tags: valueOp.map((item) => item.value)
      }
      commitState.current.textContent = 'Committing...';
      fetch(`${apiBaseUrl}/api/commitv2`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${username.accessToken}`,
          'X-Username': username.username,
        },
        body: JSON.stringify(data)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to save note.");
          }
          commitState.current.textContent = 'Committed';
          tsvscode.postMessage({ type: 'close', value: undefined });
        })
        .catch(error => {
          console.error(error);
        });

    } else {
      setErr("Please select a Main Topic and Note")
    }
    
  }
  
  if (!username.username) {
    return (
      <div className='flex flex-col justify-center items-center w-full p-4 200 h-full'>
        <h1 className=" font-extrabold tracking-light text-2xl mb-2 text-white" >Welcome To ScatteredNote</h1>
          <button className=' w-full rounded-lg bg-blue-500 p-8 mx-auto my-auto  bg-blue-500 p-8'
          onClick={() => {
            tsvscode.postMessage({ type: 'authenticate', value: undefined });
          }}
          >LOGIN</button>
        </div>
    )
  }
  
  return (
    <div className="mx-auto w-11/12 mt-10 grid grid-cols-12 ">
      <div className="col-span-8 ">
          <section className="flex flex-col">
            <h1 className="text-[#00000] font-bold">Grab Editor</h1>
            <MDEditor
              value={value}
              onChange={setValue}
              height={400}
              commands={[
                commands.bold,
                commands.italic,
                commands.strikethrough,
                commands.hr,
                commands.title,
                commands.divider,
                commands.link,
                commands.quote,
                commands.code,
                commands.codeBlock,
                commands.image,
                commands.group([...t2], {
                  name: 'language',
                  groupName: 'language',
                  buttonProps: { 'aria-label': 'Insert a language' },
                  icon: <span>language</span>,
                }),
                commands.divider,
                commands.orderedListCommand,
                commands.unorderedListCommand,
                commands.checkedListCommand,
              ]}
              extraCommands={[
                commands.codeEdit,
                commands.codePreview,
                commands.codeLive,
              ]}
            />
          </section>
          <section className="flex flex-col mt-4">
            <h1 className="text-[#00000] font-bold">Note</h1>
            <MDEditor
              value={views}
              onChange={setViews}
              height={400}
              commands={[
                commands.bold,
                commands.italic,
                commands.strikethrough,
                commands.hr,
                commands.title,
                commands.divider,
                commands.link,
                commands.quote,
                commands.code,
                commands.codeBlock,
                commands.image,
                commands.group([...t2], {
                  name: 'language',
                  groupName: 'language',
                  buttonProps: { 'aria-label': 'Insert a language' },
                  icon: <span>language</span>,
                }),
                commands.divider,
                commands.orderedListCommand,
                commands.unorderedListCommand,
                commands.checkedListCommand,
              ]}
              extraCommands={[
                commands.codeEdit,
                commands.codePreview,
                commands.codeLive,
              ]}
            />
          </section>

          <section className="flex flex-col mt-4 mb-4">
            <h1 className="text-[#00000] font-bold">Tags</h1>
            <div className='w-full ' style={{ all: "initial" }}>
              <CreatableSelect
                isMulti options={tags}
                value={valueOp}
                onChange={(newValue) => setValueOp(newValue)}
              />
            </div>
          </section>

      </div>
      <div className="col-start-9 col-span-12  p-4">
      {err && <div className="prose mt-8 bg-red-400 text-white p-4 mx-auto w-[90%]">{err}</div>}
          <h1 className="text-center text-[#00000] font-bold">Metadata</h1>
          {Array.isArray(data) && data?.length ? "" :
                <svg className='text-green-200' width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="4" cy="12" r="3" fill="green">
                    <animate id="spinner_jObz" begin="0;spinner_vwSQ.end-0.25s" attributeName="r" dur="0.75s" values="3;.2;3" />
                  </circle>
                  <circle cx="12" cy="12" r="3" fill="green">
                    <animate begin="spinner_jObz.end-0.6s" attributeName="r" dur="0.75s" values="3;.2;3" />
                  </circle>
                  <circle cx="20" cy="12" r="3" fill="green">
                    <animate id="spinner_vwSQ" begin="spinner_jObz.end-0.45s" attributeName="r" dur="0.75s" values="3;.2;3" />
                  </circle>
                </svg>
              }

          <div className="mt-8 w-full">
            <h1 className="text-[#00000] font-bold">Main Topic</h1>
            <small><i>Use an Existing Topic  or create a new Topic by just typing out the name and click on the drop down selection &ldquo;Create ...&rdquo;</i></small>
            <div className='w-full ' style={{ all: "initial" }}>
            <CreatableSelect
                options={data}
                value={mainTopic}
                onChange={(newValue) => setMainTopic(newValue)}
                isLoading={data?.length ? false : true}
              />
              </div>
          </div>
          <div className="mt-8 w-full">
            <h1 className="text-[#00000] font-bold">Sub Topic</h1>
            <small><i>Use an Existing subtopic or create a new subtopic by just typing out the name and click on the drop down selection &ldquo;Create ...&rdquo;</i></small>
            <div className='w-full ' style={{ all: "initial" }}>
              <CreatableSelect
                options={mainTopic && directoryStructure[mainTopic.value] ? directoryStructure[mainTopic.value].directory: [] }
                  value={subTopic}
                  onChange={(newValue) => setSubTopic(newValue)}
                  isDisabled={data?.length ? false : true}
                />
              </div>
          </div>
          <div className="mt-8 w-full">
            <h1 className="text-[#00000] font-bold">Notes</h1>
            <small><i>Use an Existing Note  or create a new Note by just typing out the name and click on the drop down selection &ldquo;Create ...&rdquo;</i></small>
            <div className='w-full ' style={{ all: "initial" }}>
              <CreatableSelect
                  options={notes()}
                  value={note}
                  onChange={(newValue) => setNote(newValue)}
                />
            </div> 
          </div>

          {/* <div className="flex items-center relative mt-8">
            <small className='absolute top-0'><i>Make a new note public or private</i></small>
            <br />
            <label
              htmlFor="toggle"
              className="flex items-center cursor-pointer mt-10"
            >
              <div className="relative">
                <input
                  id="toggle"
                  type="checkbox"
                  className="sr-only"
                  checked={!isPublic}
                  onChange={handleToggle}
                />
                <div
                  className={`block ${
                    isPublic ? 'bg-green-400' : 'bg-gray-600'
                  } w-14 h-8 rounded-full transition duration-300`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition duration-300 ${
                    isPublic ? 'transform translate-x-full' : ''
                  }`}
                ></div>
              </div>
              <div className="ml-3 text-gray-700 font-medium">
                {isPublic ? 'Public' : 'Private'}
              </div>
            </label>
          </div> */}

          <div>
            <button
              ref={commitState}
              className='px-4 py-2 bg-green-400 text-white rounded-md mt-8 mx-auto float-right'
              onClick={()=> handleCommit()}
            >
              Commit
            </button>
          </div>
        </div>
    </div>
  );
 }

