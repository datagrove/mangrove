
// admin settings have to display default true/fal

interface Option {
    name: string
    default: boolean
    allowed: boolean
}

interface PasswordRules {
    kinds: number
    length: number
}

interface SecurityPolicy {
    options: {
        [key: string]: Option
    }
    passwordRules: PasswordRules
}
