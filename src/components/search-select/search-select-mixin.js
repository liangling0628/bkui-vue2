import Tippy from '@/utils/tippy'
import SearchInputMenu from './search-select-menu'
import Vue from 'vue'
class ChipItem {
    constructor (item, menuItem, { explainCode, displayKey, splitCode }) {
        this.value = item
        this.menuItem = menuItem
        this.explainCode = explainCode
        this.displayKey = displayKey
        this.splitCode = splitCode
        this.needExplainCode = this.hasValues
    }
    get text () {
        return this.keyText + this.explainText + this.conditionText + this.valueText
    }
    get hasValues () {
        return !!(this.value.values && this.value.values.length)
    }
    get hasCondition () {
        return !!this.value.condition
    }
    get keyText () {
        return this.value[this.displayKey]
    }
    get valueText () {
        return this.hasValues ? this.value.values.map(v => v[this.displayKey]).join(this.splitCode) : ''
    }
    get conditionText () {
        return this.hasCondition ? this.value.condition[this.displayKey] : ''
    }
    get explainText () {
        return this.needExplainCode ? this.explainCode : ''
    }
    get valueList () {
        return this.menuItem ? this.menuItem.children : []
    }
    get conditionList () {
        return this.menuItem ? this.menuItem.conditions : []
    }
    get checkedValues () {
        // eslint-disable-next-line no-sequences
        return this.value.values.reduce((pre, cur) => ((pre[cur.id] = cur), pre), {})
    }
    get canShowMenuPopover () {
        return !!this.menuItem
    }
    get canShowChildPopover () {
        return this.canShowMenuPopover && this.menuItem.children.length > 0
    }
}
export default {
    data () {
        return {
            chipMenuInstance: null,
            chipChildMenuInstance: null,
            chipPopoperInstance: null,
            editChipItem: null
        }
    },
    methods: {
        initChipMenu () {
            if (!this.chipMenuInstance) {
                this.chipMenuInstance = new Vue(SearchInputMenu).$mount()
                this.chipMenuInstance.condition = this.defaultCondition
                this.chipMenuInstance.displayKey = this.displayKey
                this.chipMenuInstance.primaryKey = this.primaryKey
                this.chipMenuInstance.multiable = false
                // this.menuInstance.$on('select', this.handleMenuSelect)
                // this.menuInstance.$on('select-conditon', this.handleSelectConditon)
            }
        },
        initChipChildMenu (menuItem) {
            this.chipChildMenuInstance = new Vue(SearchInputMenu).$mount()
            this.chipChildMenuInstance.displayKey = this.displayKey
            this.chipChildMenuInstance.primaryKey = this.primaryKey
            this.chipChildMenuInstance.multiable = menuItem.conditions && menuItem.conditions.length ? false : (menuItem.multiable || false)
            this.chipChildMenuInstance.child = true
            this.chipChildMenuInstance.remoteEmptyText = this.defaultRemoteEmptyText
            this.chipChildMenuInstance.remoteLoadingText = this.defaultRemoteLoadingText
            // this.chipChildMenuInstance.$on('select', this.handleMenuChildSelect)
            // this.chipChildMenuInstance.$on('select-check', this.handleSelectCheck)
            // this.chipChildMenuInstance.$on('select-enter', this.handleKeyEnter)
            // this.chipChildMenuInstance.$on('select-cancel', this.handleCancel)
            // this.chipChildMenuInstance.$on('child-condition-select', this.handleChildConditionSelect)
        },
        initChipPopover (target, el) {
            if (!this.chipPopoperInstance) {
                this.chipPopoperInstance = Tippy(target, {
                    content: el || this.chipMenuInstance.$el,
                    arrow: false,
                    placement: 'bottom-start',
                    trigger: 'manual',
                    theme: 'light bk-search-select-theme',
                    hideOnClick: false,
                    animateFill: false,
                    animation: 'slide-toggle',
                    lazy: false,
                    ignoreAttributes: true,
                    boundary: 'window',
                    distance: 15,
                    zIndex: this.popoverZindex,
                    onHide: () => {
                        this.chipMenuInstance && this.chipMenuInstance.handleDestroy()
                        this.chipChildMenuInstance && this.chipChildMenuInstance.handleDestroy()
                        return true
                    }
                })
            }
        },
        showChipMenu (show = true) {
            if (!this.chipMenuInstance) {
                this.initChipMenu()
            }
            this.handeleChipPopperEventListener(false)
            this.chipMenuInstance.isCondition = false
            this.chipMenuInstance.list = this.data
            if (show) {
                this.showChipPopper(this.chipMenuInstance.$el)
                // this.$emit('show-menu', this.chipMenuInstance)
            } else {
                this.hideChipPopper()
            }
        },
        showChildChipMenu (list, filter, isShow = true) {
            // this.chipChildMenuInstance.filter = filter
            // this.chipChildMenuInstance.list = list
            this.handeleChipPopperEventListener(true)
            isShow && this.showPopper(this.chipChildMenuInstance.$el)
        },
        handeleChipPopperEventListener (isChild = false) {
            if (isChild) {
                this.chipMenuInstance && this.chipMenuInstance.handleDestroy()
                this.chipChildMenuInstance && this.chipChildMenuInstance.handleMounted()
                return
            }
            this.chipChildMenuInstance && this.chipChildMenuInstance.handleDestroy()
            this.chipMenuInstance.handleMounted()
        },
        showChipPopper (el) {
            if (this.data.length) {
                this.chipPopoperInstance.setContent(el)
                this.chipPopoperInstance.popperInstance.update()
                this.chipPopoperInstance.show(this.showDelay)
            }
        },
        hideChipPopper () {
            if (this.chipPopoperInstance) {
                this.chipPopoperInstance.hide(0)
                this.chipPopoperInstance.destroy()
                this.chipPopoperInstance = null
            }
        },
        handleEditChip (e, item, index) {
            e.preventDefault()
            this.$set(item, 'edit', true)
            console.info(item, index, '======')
            setTimeout(() => {
                const chipInput = this.$refs[`value-${index}`][0]
                if (chipInput) {
                    chipInput.focus()
                    this.input.focus = true
                    const range = window.getSelection()
                    range.selectAllChildren(chipInput)
                    range.collapseToEnd()
                    const menuItem = this.data.find(set => set[this.primaryKey] === item.id)
                    const editChipItem = new ChipItem(item, menuItem, { explainCode: this.explainCode, displayKey: this.displayKey, splitCode: this.splitCode })
                    if (editChipItem.hasValues && editChipItem.canShowChildPopover) {
                        this.initChipChildMenu(menuItem)
                        this.initChipPopover(chipInput, this.chipChildMenuInstance.$el)
                        this.chipChildMenuInstance.list = editChipItem.valueList
                        this.chipChildMenuInstance.checked = editChipItem.checkedValues
                        this.showChildChipMenu()
                    } else if (editChipItem.canShowMenuPopover) {
                        this.initChipMenu()
                        this.initChipPopover(chipInput, this.chipMenuInstance.$el)
                        this.chipMenuInstance.list = this.data
                        this.showChipMenu()
                    }
                    this.editChipItem = editChipItem
                }
                console.info(item, chipInput, '=========')
            }, 20)
        },
        handleChipBlur (e, item) {
            this.hideChipPopper()
            item.edit = false
        },
        handleChipKeydown (e, item, index) {
            if (this.readonly && !(e.code === 'Backspace')) {
                e.preventDefault()
                return false
            }
            switch (e.code) {
                case 'Enter':
                case 'NumpadEnter':
                    break
                case 'Backspace':
                    const keys = item.values
                    const menuItem = this.data.find(set => set[this.primaryKey] === item.id) || {}
                    if (menuItem.multiable) {
                        if (keys.length) {
                            const key = keys[keys.length - 1]
                            this.chipChildMenuInstance && this.chipChildMenuInstance.setCheckValue(key, false)
                            item.values.splice(keys.length - 1, 1)
                            e.preventDefault()
                            // this.showChipPopper(this.chipChildMenuInstance.$el)
                            return false
                        } else {
                            item.edit = false
                            this.hideChipPopper()
                            debugger
                            this.values.splice(index, 1)
                            // this.$refs.input.focus()
                        }
                    } else {
                        // this.showChipPopper(this.chipChildMenuInstance.$el)
                    }
                    break
            }
        },
        handleChipClick (e, item) {
            this.showChildChipMenu()
        }
    }
}
