import {z} from "zod"

const result = z.string().url().parse("select: {id: true,name: true,budget: true,},")
console.log(result)