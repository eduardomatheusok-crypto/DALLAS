package com.fittreino.controller;

import com.fittreino.dto.request.SendMessageRequest;
import com.fittreino.dto.response.ChatMessageDto;
import com.fittreino.service.ChatService;
import com.fittreino.service.CurrentUserResolver;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/messages")
public class ChatController {

    private final ChatService service;
    private final CurrentUserResolver currentUser;

    public ChatController(ChatService service, CurrentUserResolver currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<ChatMessageDto> list(@PathVariable String groupId,
                                     @RequestParam(required = false) String before,
                                     @RequestParam(required = false) Integer limit,
                                     @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        Instant cursor = (before != null && !before.isBlank()) ? safeParse(before) : null;
        return service.list(currentUser.resolveUserId(authorization), groupId, cursor, limit);
    }

    @PostMapping
    public ResponseEntity<ChatMessageDto> send(@PathVariable String groupId,
                                               @Valid @RequestBody SendMessageRequest request,
                                               @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.send(currentUser.resolveUserId(authorization), groupId, request));
    }

    private Instant safeParse(String value) {
        try {
            return Instant.parse(value);
        } catch (Exception e) {
            return null;
        }
    }
}