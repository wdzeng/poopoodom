import helloworld from '@/helloworld'

// The `process.env.VERSION` is replaced in the build time.
console.log('typescript template: %s', process.env.VERSION ?? 'development')
helloworld()
