using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Text;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ExileCompanion.Desktop.Models;

namespace ExileCompanion.Desktop.ViewModels;

public partial class MainViewModel : ObservableObject
{
    public string ApplicationTitle => "Exile Companion";

    private readonly DashboardViewModel _dashboardViewModel;
    private readonly CharactersViewModel _charactersViewModel;

    [ObservableProperty]
    private ObservableObject _currentViewModel;

    public MainViewModel(
        DashboardViewModel dashboardViewModel,
        CharactersViewModel charactersViewModel)
    {
        _dashboardViewModel = dashboardViewModel;
        _charactersViewModel = charactersViewModel;
        CurrentViewModel = _dashboardViewModel;
    }

    [RelayCommand]
    private void NavigateToDashboard()
    {
        CurrentViewModel = _dashboardViewModel;
    }

    [RelayCommand]
    private void NavigateToCharacters()
    {
        CurrentViewModel = _charactersViewModel;
    }
}


