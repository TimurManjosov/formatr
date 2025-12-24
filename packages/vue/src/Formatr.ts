import { defineComponent, toRefs, h, type PropType } from 'vue';
import { useFormat } from './composables';

export const Formatr = defineComponent({
  name: 'Formatr',
  props: {
    template: {
      type: String,
      required: true,
    },
    context: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
  setup(props) {
    const { template: templateRef, context: contextRef } = toRefs(props);
    const formatted = useFormat(templateRef, contextRef);
    
    return () => h('span', formatted.value);
  },
});
