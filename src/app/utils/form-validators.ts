import { FormGroup, ValidationErrors } from "@angular/forms";

export class FormValidatorsCustom {

    static emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    static passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    static namePattern = /^[a-zA-ZÀ-ÿ\s]+$/;
    static phonePattern = /^\+?[0-9]{7,15}$/;

    static isValidField(form: FormGroup, fieldName: string): boolean {
        return (!!form.controls[fieldName].errors && form.controls[fieldName].touched);
    }

    static getFieldError(form: FormGroup, fieldName: string): string | null {
        if (!form.controls[fieldName]) {
            return null;
        }
        const errors = form.controls[fieldName].errors ?? {};

        return FormValidatorsCustom.getTextError(errors);

    }

    static getTextError(errors: ValidationErrors): string | null {
        for (const key of Object.keys(errors)) {
            console.log(key)
            switch (key) {
                case 'required':
                    return 'Este campo es requerido';
                case 'minlength':
                    return `El campo debe tener al menos ${errors[key].requiredLength} caracteres`;
                case 'min':
                    return `El campo debe ser mayor a ${errors[key].min}`;
                case 'max':
                    return `El campo debe ser menor a ${errors[key].max}`;
                case 'pattern':
                    if (errors['pattern'].requiredPattern === FormValidatorsCustom.emailPattern) return 'El formato del email es incorrecto';
                    if (errors['pattern'].requiredPattern === FormValidatorsCustom.passwordPattern) return 'El formato de la contraseña es incorrecto';
                    if (errors['pattern'].requiredPattern === FormValidatorsCustom.namePattern) return 'El formato del nombre es incorrecto';
                    if (errors['pattern'].requiredPattern === FormValidatorsCustom.phonePattern) return 'El formato del teléfono es incorrecto';
                    return 'El formato del campo es incorrecto';
                default:
                    return 'El formato del campo es incorrecto';

            }
        }
        return null;
    }
}