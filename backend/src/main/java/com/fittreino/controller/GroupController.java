package com.fittreino.controller;

import com.fittreino.dto.request.CreateGroupRequest;
import com.fittreino.dto.request.JoinGroupRequest;
import com.fittreino.dto.response.GroupDto;
import com.fittreino.dto.response.GroupSummaryDto;
import com.fittreino.service.CurrentUserResolver;
import com.fittreino.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService service;
    private final CurrentUserResolver currentUser;

    public GroupController(GroupService service, CurrentUserResolver currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<GroupSummaryDto> listMine(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.listMine(currentUser.resolveUserId(authorization));
    }

    @PostMapping
    public ResponseEntity<GroupDto> create(@Valid @RequestBody CreateGroupRequest request,
                                           @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(currentUser.resolveUserId(authorization), request));
    }

    @GetMapping("/{id}")
    public GroupDto getById(@PathVariable String id,
                            @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getById(currentUser.resolveUserId(authorization), id);
    }

    @PostMapping("/join")
    public GroupDto joinByCode(@Valid @RequestBody JoinGroupRequest request,
                               @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.joinByCode(currentUser.resolveUserId(authorization), request);
    }

    @PostMapping("/{id}/join")
    public GroupDto joinById(@PathVariable String id,
                             @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.joinById(currentUser.resolveUserId(authorization), id);
    }

    @PostMapping("/{id}/leave")
    public void leave(@PathVariable String id,
                      @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        service.leave(currentUser.resolveUserId(authorization), id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id,
                       @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        service.delete(currentUser.resolveUserId(authorization), id);
    }
}