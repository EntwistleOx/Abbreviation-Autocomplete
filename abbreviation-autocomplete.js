// Inserts an element into a sorted array containing a limited range of integers
//  @param {array} arr The sorted array
//  @param {array} arrReduced The array represented in the form:
//    [e1: [a1, b1], e2: [a2, b2]]
//    where
//      eX is an element of the array
//      aX is the first index that contains eX in the array
//      bX is the last index that contains eX in the array
//  @param {integer} elem The integer to be inserted into "arrReduced"
//  @throws {TypeError} for incorrect parameter types
function countingSortInsert (arr, arrReduced, elem, elemGroup) {
  if (!(arr instanceof Array)) {
    throw new TypeError('1st param "arr" must be an array')
  }

  if (!(arrReduced instanceof Array)) {
    throw new TypeError('1st param "arrReduced" must be an array')
  }

  // Increase indicies for elements greater than elem
  for (let i = elemGroup + 1; i < arrReduced.length; i++) {
    const range = arrReduced[i]

    if (range) {
      range[0]++
      range[1]++
    }
  }

  const elemRange = arrReduced[elemGroup]

  if (elemRange) { // Increase elem's ending index
    elemRange[1]++
  } else { // Create elem's indicies because it's not in arrReduced yet
    for (var i = elemGroup - 1; i >= 0; i--) {
      const range = arrReduced[i]

      if (range) {
        const afterLastPosition = range[1] + 1
        arrReduced[elemGroup] = [afterLastPosition, afterLastPosition]
        break
      }
    }

    if (i < 0) {
      arrReduced[elemGroup] = [0, 0]
    }
  }

  arr.splice(arrReduced[elemGroup][1], 0, elem)
}

Vue.component('abbreviation-autocomplete', {
  data: function () {
    return {
      focused: false,
      input: '',
      loading: false,
      recentlySelected: false,
      searchList: [],
      selected: -1
    }
  },
  props: {
    data: Array,
    debounceWait: Number,
    limit: {
      default: Infinity,
      type: Number
    },
    minInputLength: {
      default: 1,
      type: Number
    }
  },
  watch: {
    input: function () {
      this.onInputChange()
    }
  },
  methods: {
    loadRelatedItems: function () {
      if (this.input.length >= this.minInputLength) {
        const countingSortData = []
        const relatedResults = []

        this.data.forEach((elem) => {
          const index = elem.d.toLowerCase().indexOf(this.input.toLowerCase())

          // if user input is a substring of this definition
          if (index >= 0) {
            countingSortInsert(relatedResults, countingSortData, elem, index)
            elem.substrIndex = index
          }
        })

        this.searchList = relatedResults.length <= this.limit ? relatedResults : relatedResults.slice(0, this.limit)
        this.loading = false
      } else {
        return []
      }
    },
    onInputChange: function () {
      if (this.recentlySelected) {
        this.recentlySelected = false
      } else {
        this.focused = true
        this.selected = -1
      }

      if (this.input.length >= this.minInputLength) {
        this.loading = true
        this.searchList = this.loadRelatedItems()
      } else {
        this.loading = false
        this.searchList = []
      }
    },

    onUnfocus: function () {
      this.focused = false
    },

    print: function (msg) {
      console.log(msg)
    },

    select: function () {
      if (this.selected !== -1) {
        this.focused = false
        this.input = this.searchList[this.selected].a
        this.recentlySelected = true
      }
    },

    selectDown: function () {
      this.selected = (this.selected + 1) % this.searchList.length
    },

    selectUp: function () {
      if (this.selected === -1) {
        this.selected = 0
      }

      const searchLength = this.searchList.length
      this.selected = (this.selected + searchLength - 1) % searchLength
    },

    setSelected (index) {
      this.selected = index
    }
  },
  template: `
<div class="abbreviation-autocomplete">
  <input type="text" v-model="input" @focus="focused = true" @blur="onUnfocus" @keyup.enter="select" @keydown.down="selectDown" @keydown.up="selectUp">
  <ul v-show="focused" @mousedown="select">
    <li v-show="loading">
      <svg height="10" width="10">
        <circle cx="5" cy="5" r="3"/>
      </svg> 
      <svg height="10" width="10">
        <circle cx="5" cy="5" r="3"/>
      </svg> 
      <svg height="10" width="10">
        <circle cx="5" cy="5" r="3"/>
      </svg> 
    </li>
    <li v-for="(element, index) in searchList" :class="{ selected: index === selected }" @mouseover="setSelected(index)">
      <span>{{ element.a }}</span>
      <span> ({{ element.d.substr(0, element.substrIndex) }}</span><span class="highlight">{{ input }}</span><span>{{ element.d.substr(element.substrIndex + input.length) }})</span>
    </li>
  </ul>
</div>
`,
  created: function () {
    this.data.sort((a, b) => a.d.localeCompare(b.d))

    if (this.debounceWait) {
      this.loadRelatedItems = _.debounce(this.loadRelatedItems, this.debounceWait)
    }

    const listeners = this.$listeners

    // Only emit if there's a listener attached on creation
    if (listeners) {
      if (listeners['update:input']) {
        this.onInputChange = () => {
          if (this.recentlySelected) {
            this.recentlySelected = false
          } else {
            this.focused = true
            this.selected = -1
          }

          if (this.input.length >= this.minInputLength) {
            this.loading = true
            this.searchList = this.loadRelatedItems()
          } else {
            this.loading = false
            this.searchList = []
          }

          this.$emit('update:input', this.input)
        }
      }

      if (listeners.select) {
        this.select = () => {
          if (this.selected !== -1) {
            this.focused = false
            // clear key used for sorting autocomplete results
            delete this.searchList[this.selected].substrIndex
            this.$emit('select', this.searchList[this.selected])
            this.input = this.searchList[this.selected].a
            this.recentlySelected = true
          }
        }
      }
    }
  }
})
