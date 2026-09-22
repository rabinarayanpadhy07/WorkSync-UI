import 'quill/dist/quill.snow.css'; // ES6
import 'quill-mention/autoregister';
import 'quill-mention/dist/quill.mention.css';
import 'quill-mention/dist/quill.mention.css';

import { ImageIcon, XIcon } from 'lucide-react';
import Quill from 'quill';
import { useEffect, useRef, useState } from 'react';
import { MdSend } from 'react-icons/md';
import { PiTextAa } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Hint } from '../Hint/Hint';

export const Editor = ({
    variant = 'create',
    onSubmit,
    onTextChange,
    workspaceMembers = [],
    workspaceChannels = [],
    onCancel,
    placeholder,
    defaultValue,
    seedValue
}) => {

    const [isToolbarVisible, setIsToolbarVisible] = useState(false);

    const [image, setImage] = useState(null);

    const containerRef = useRef(); // reqd to initialize the editor
    const defaultValueRef = useRef([]);
    const quillRef = useRef();
    const imageInputRef = useRef(null);
    const onTextChangeRef = useRef(onTextChange);
    const submitRef = useRef(null);
    const lastAppliedSeedRef = useRef(null);
    const workspaceMembersRef = useRef(workspaceMembers);
    const workspaceChannelsRef = useRef(workspaceChannels);

    useEffect(() => {
        try {
            defaultValueRef.current = defaultValue ? JSON.parse(defaultValue) : [];
        } catch {
            defaultValueRef.current = [];
        }
    }, [defaultValue]);

    useEffect(() => {
        onTextChangeRef.current = onTextChange;
    }, [onTextChange]);

    useEffect(() => {
        workspaceMembersRef.current = workspaceMembers;
        workspaceChannelsRef.current = workspaceChannels;
    }, [workspaceChannels, workspaceMembers]);

    function toggleToolbar() {
        setIsToolbarVisible(!isToolbarVisible);
        const toolbar = containerRef.current.querySelector('.ql-toolbar');
        if(toolbar) {
            toolbar.classList.toggle('hidden');
        }
    }

    submitRef.current = () => {
        const contents = quillRef.current?.getContents();
        const text = quillRef.current?.getText().replace(/\n$/, '');
        
        if (!text && !image && variant === 'create') return;

        const messageContent = JSON.stringify(contents);
        
        const mentions = [];
        contents?.ops?.forEach(op => {
            if (op.insert && op.insert.mention) {
                if (op.insert.mention.denotationChar === '@') {
                    mentions.push(op.insert.mention.id);
                }
            }
        });

        onSubmit({ body: messageContent, image, mentions });
        quillRef.current?.setText('');
        setImage(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    useEffect(() => {

        if(!containerRef.current) return; // if containerRef is not initialized, return

        const container = containerRef.current; // get the container element

        const editorContainer = container.appendChild(container.ownerDocument.createElement('div')); // create a new div element and append it to the container

        const options = {
            theme: 'snow',
            placeholder,
            modules: {
                mention: {
                    allowedChars: /^[A-Za-z0-9_\s]*$/,
                    mentionDenotationChars: ["@", "#"],
                    mentionContainer: document.body,
                    source: function (searchTerm, renderList, mentionChar) {
                        let values;

                        if (mentionChar === "@") {
                            values = workspaceMembersRef.current
                                .map(m => ({ id: m.memberId?._id, value: m.memberId?.username }))
                                .filter(m => m.id);
                        } else {
                            values = workspaceChannelsRef.current
                                .map(c => ({ id: c._id, value: c.name }));
                        }

                        if (searchTerm.length === 0) {
                            renderList(values, searchTerm);
                        } else {
                            const matches = [];
                            for (let i = 0; i < values.length; i++)
                                if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) matches.push(values[i]);
                            renderList(matches, searchTerm);
                        }
                    },
                },
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['link'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['clean']
                ],
                keyboard: {
                    bindings: {
                        enter: {
                            key: 'Enter',
                            shiftKey: false,
                            handler: () => {
                                const mentionModule = quillRef.current?.getModule('mention');
                                if (mentionModule && mentionModule.isOpen) {
                                    return true;
                                }

                                submitRef.current?.();
                                return false;
                            }
                        },
                        shift_enter: {
                            key: 'Enter',
                            shiftKey: true,
                            handler: (range) => {
                                quillRef.current?.insertText(range.index, '\n');
                                quillRef.current?.setSelection(range.index + 1);
                                return false;
                            }
                        }
                    }
                }
            }
        };

        const quill = new Quill(editorContainer, options);

        quillRef.current = quill;
        quillRef.current.focus();

        quill.setContents(defaultValueRef.current);

        quill.on('text-change', () => {
            if (onTextChangeRef.current) {
                onTextChangeRef.current(JSON.stringify(quillRef.current?.getContents()));
            }
        });

        // Hide toolbar on initial load
        const toolbar = container.querySelector('.ql-toolbar');
        if (toolbar) {
            toolbar.classList.add('hidden');
        }

    }, [placeholder]);

    useEffect(() => {
        if (!quillRef.current || !seedValue || seedValue === lastAppliedSeedRef.current) return;

        try {
            const parsedSeed = JSON.parse(seedValue);
            quillRef.current.setContents(parsedSeed);
            const length = quillRef.current.getLength();
            quillRef.current.setSelection(Math.max(length - 1, 0), 0);
            quillRef.current.focus();
            lastAppliedSeedRef.current = seedValue;
        } catch {
            // Ignore malformed externally seeded drafts.
        }
    }, [seedValue]);


    return (
        <div className='flex flex-col'>
            <div className='flex flex-col border border-purple-600/30 rounded-xl focus-within:shadow-[0_0_15px_rgba(147,51,234,0.15)] focus-within:border-purple-500/50 bg-[#13151a] relative overflow-hidden transition-all text-white'>
                
                {/* Quill Editor instance */}
                <div className='h-full ql-custom text-slate-200' ref={containerRef} />
                
                {image && (
                    <div className='p-2'>
                        <div className='relative size-[60px] flex items-center justify-center group/image'>
                            <button
                                className='hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[5] border-2 border-white items-center justify-center'
                                onClick={() => {
                                    setImage(null);
                                    if (imageInputRef.current) {
                                        imageInputRef.current.value = '';
                                    }
                                }}
                            >
                                <XIcon className='size-4' />
                            </button>
                            <img 
                                src={URL.createObjectURL(image)}
                                className='rounded-xl overflow-hidden border border-white/10 object-cover'
                                alt="Attachment"
                            />
                        </div>
                    </div>
                )}

                {/* Bottom Toolbar Actions */}
                <div className='flex items-center px-2 pb-2 pt-1 z-[5] gap-1'>
                    <Hint label={!isToolbarVisible ? 'Show toolbar' : 'Hide toolbar'} side='top' align='center'>
                        <Button
                            size="iconSm"
                            variant="ghost"
                            onClick={toggleToolbar}
                            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full size-8"
                        >
                            <PiTextAa className='size-4' />
                        </Button>
                    </Hint>

                    <Hint label="Image">
                        <Button
                            size="iconSm"
                            variant="ghost"
                            onClick={() => { imageInputRef.current?.click(); }}
                            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full size-8"
                        >
                            <ImageIcon className='size-4' />
                        </Button>
                    </Hint>

                    <input 
                        type="file"
                        className='hidden'
                        ref={imageInputRef}
                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />

                    {/* Send / Cancel Actions */}
                    <div className="ml-auto flex items-center gap-2 pr-1">
                        {variant === 'update' && (
                            <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full h-8">
                                Cancel
                            </Button>
                        )}
                        <Hint label="Send Message">
                            <Button
                                size={variant === 'update' ? 'sm' : 'icon'}
                                className={`bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)] transition-all ${variant === 'update' ? 'rounded-full h-8 px-4' : 'rounded-xl size-8'}`}
                                onClick={() => {
                                    submitRef.current?.();
                                }}
                            >
                                {variant === 'update' ? 'Save' : <MdSend className='size-4 ml-0.5' />}
                            </Button>
                        </Hint>
                    </div>
                </div>
            </div>

            <p className='p-2 text-[11px] text-slate-500 flex justify-end font-medium'>
                <strong>Shift + return</strong> <span className="ml-1 font-normal opacity-80">to add a new line</span>
            </p>
        </div>
    );
};
