package com.fittreino.controller;

import com.fittreino.dto.request.CreateCompetitionRequest;
import com.fittreino.dto.response.CompetitionDto;
import com.fittreino.dto.response.RankingEntryDto;
import com.fittreino.service.CompetitionService;
import com.fittreino.service.CurrentUserResolver;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CompetitionController {

    private final CompetitionService service;
    private final CurrentUserResolver currentUser;

    public CompetitionController(CompetitionService service, CurrentUserResolver currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping("/groups/{groupId}/competitions")
    public List<CompetitionDto> listByGroup(@PathVariable String groupId,
                                            @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.listByGroup(currentUser.resolveUserId(authorization), groupId);
    }

    @PostMapping("/groups/{groupId}/competitions")
    public ResponseEntity<CompetitionDto> create(@PathVariable String groupId,
                                                 @Valid @RequestBody CreateCompetitionRequest request,
                                                 @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(currentUser.resolveUserId(authorization), groupId, request));
    }

    @PostMapping("/competitions/{id}/join")
    public CompetitionDto join(@PathVariable String id,
                               @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.join(currentUser.resolveUserId(authorization), id);
    }

    @GetMapping("/competitions/{id}/ranking")
    public List<RankingEntryDto> ranking(@PathVariable String id,
                                         @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getRanking(currentUser.resolveUserId(authorization), id);
    }

    @PostMapping("/competitions/{id}/finish")
    public void finish(@PathVariable String id,
                       @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        service.finishNow(currentUser.resolveUserId(authorization), id);
    }
}