<template>
    <div>
        <codemirror ref="myCm" v-model="code" :options="cmOptions" style="font-size: 1rem;text-align: left;" :style="{height: customHeight}">
        </codemirror>
    </div>
</template>

<script>
    import { codemirror } from 'vue-codemirror'
    import 'codemirror/lib/codemirror.css'
    import 'codemirror/mode/python/python.js'
    import 'codemirror/theme/monokai.css'
    // require active-line.js
    import 'codemirror/addon/selection/active-line.js'
    // styleSelectedText
    import 'codemirror/addon/selection/mark-selection.js'
    import 'codemirror/addon/search/searchcursor.js'
    // hint
    import 'codemirror/addon/hint/show-hint.js'
    import 'codemirror/addon/hint/show-hint.css'
    import 'codemirror/addon/hint/javascript-hint.js'
    import 'codemirror/addon/selection/active-line.js'
    // highlightSelectionMatches
    import 'codemirror/addon/scroll/annotatescrollbar.js'
    import 'codemirror/addon/search/matchesonscrollbar.js'
    import 'codemirror/addon/search/searchcursor.js'
    import 'codemirror/addon/search/match-highlighter.js'
    // keyMap
    import 'codemirror/mode/clike/clike.js'
    import 'codemirror/addon/edit/matchbrackets.js'
    import 'codemirror/addon/comment/comment.js'
    import 'codemirror/addon/dialog/dialog.js'
    import 'codemirror/addon/dialog/dialog.css'
    import 'codemirror/addon/search/searchcursor.js'
    import 'codemirror/addon/search/search.js'
    import 'codemirror/keymap/sublime.js'
    // foldGutter
    import 'codemirror/addon/fold/foldgutter.css'
    import 'codemirror/addon/fold/brace-fold.js'
    import 'codemirror/addon/fold/comment-fold.js'
    import 'codemirror/addon/fold/foldcode.js'
    import 'codemirror/addon/fold/foldgutter.js'
    import 'codemirror/addon/fold/indent-fold.js'
    import 'codemirror/addon/fold/markdown-fold.js'
    import 'codemirror/addon/fold/xml-fold.js'

    export default {
        props: ['customHeight'],
        components: {
            codemirror
        },

        data () {
            return {
                code: '',
                cmOptions: {
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    indentUnit: 4,
                    indentWithTabs: true,
                    tabSize: 4,
                    smartIndent: true,
                    styleActiveLine: true,
                    lineNumbers: true,
                    lineWrapping: false,
                    line: true,
                    foldGutter: true,
                    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                    mode: 'text/x-python',
                    theme: 'monokai',
                    keyMap: 'sublime',
                    showCursorWhenSelecting: true,
                    extraKeys: {
                        Tab (cm) {
                            if (cm.somethingSelected()) {
                                cm.indentSelection('add')
                            } else {
                                cm.replaceSelection(cm.getOption('indentWithTabs') ? '\t' : Array(cm.getOption('indentUnit') + 1).join(' '), 'end', '+input')
                            }
                        }
                    }
                },
                editor: ''
            }
        },

        computed: {
        },

        mounted () {
            this.editor = this.$refs.myCm.codemirror
        },

        methods: {
            getCode () {
                return this.code
            },

            setCode (code) {
                this.code = code
            }
        }
    }
</script>

<style lang="scss">
    .CodeMirror {
        height: 100%;
        .CodeMirror-scroll {
            margin-right: -0.3rem;
        }
    }
</style>
