package com.integradorarq.portal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateReportRequest(
        @NotBlank(message = "La cédula es obligatoria")
        @Pattern(regexp = "^[0-9]{10}$", message = "La cédula debe tener 10 dígitos")
        String cedula,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "Debe ser un email válido")
        String email
) {
}
