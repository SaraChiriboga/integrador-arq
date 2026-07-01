package com.integradorarq.portal.service;

import com.integradorarq.portal.config.RabbitMQConfig;
import com.integradorarq.portal.dto.SolicitudOsintEvent;
import com.integradorarq.portal.exception.DuplicateRequestException;
import com.integradorarq.portal.exception.ReportNotFoundException;
import com.integradorarq.portal.model.Request;
import com.integradorarq.portal.model.User;
import com.integradorarq.portal.repository.RequestRepository;
import com.integradorarq.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository userRepository;
    private final RequestRepository requestRepository;
    private final StringRedisTemplate redisTemplate;
    private final RabbitTemplate rabbitTemplate;

    private static final String LOCK_PREFIX = "lock:reporte:";

    public Request createReport(String cedula, String email) {
        String lockKey = LOCK_PREFIX + cedula;
        
        // 1. Verifica idempotencia en Redis
        Boolean isLocked = redisTemplate.hasKey(lockKey);
        if (Boolean.TRUE.equals(isLocked)) {
            throw new DuplicateRequestException("Ya existe una solicitud en proceso para la cédula: " + cedula);
        }

        // 2. Crea lock en Redis con TTL de 10 minutos
        redisTemplate.opsForValue().set(lockKey, String.valueOf(System.currentTimeMillis()), Duration.ofMinutes(10));

        // 3. Busca el User por cedula, o créalo si no existe
        User user = userRepository.findByCedula(cedula).orElseGet(() -> {
            User newUser = User.builder()
                    .cedula(cedula)
                    .email(email)
                    .build();
            return userRepository.save(newUser);
        });

        // Actualiza el email si cambió
        if (!user.getEmail().equals(email)) {
            user.setEmail(email);
            user = userRepository.save(user);
        }

        // 4. Crea un nuevo Request
        Request request = Request.builder()
                .user(user)
                .targetId(cedula)
                .requesterEmail(email)
                .build();
        request = requestRepository.save(request);

        // 5. Publica el evento en RabbitMQ
        SolicitudOsintEvent event = SolicitudOsintEvent.builder()
                .requestId(request.getId().toString())
                .targetId(cedula)
                .requesterEmail(email)
                .timestamp(System.currentTimeMillis())
                .build();

        rabbitTemplate.convertAndSend(RabbitMQConfig.SOLICITUD_EXCHANGE, RabbitMQConfig.SOLICITUD_ROUTING_KEY, event);

        // 6. Retorna el Request creado
        return request;
    }

    public Request findById(UUID requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ReportNotFoundException("No se encontró el reporte con ID: " + requestId));
    }
}
